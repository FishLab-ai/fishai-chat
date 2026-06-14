//! FishAI v3 SIMD/汇编加速模块 — CPU极限优化
//!
//! 不管硬件多差都要跑到极致
//! 运行时CPU特性检测 → 自动选择最优路径:
//!   AVX-512+VNNI > AVX-512 > AVX2+FMA > SSE4.2 > 标量
//!
//! 核心加速: mat_vec(矩阵×向量), rms_norm, softmax, dot_product, silu

use std::arch::x86_64::*;

// ═══════════════════════ CPU 特性检测 ═══════════════════════

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SimdLevel {
    Scalar,
    Sse42,
    Avx2,
    Avx512,
    Avx512Vnni,
}

pub fn detect_simd_level() -> SimdLevel {
    if is_x86_feature_detected!("avx512vnni") && is_x86_feature_detected!("avx512bw") {
        SimdLevel::Avx512Vnni
    } else if is_x86_feature_detected!("avx512f") {
        SimdLevel::Avx512
    } else if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        SimdLevel::Avx2
    } else if is_x86_feature_detected!("sse4.2") {
        SimdLevel::Sse42
    } else {
        SimdLevel::Scalar
    }
}

pub fn simd_level_name(level: SimdLevel) -> &'static str {
    match level {
        SimdLevel::Scalar => "Scalar",
        SimdLevel::Sse42 => "SSE4.2",
        SimdLevel::Avx2 => "AVX2+FMA",
        SimdLevel::Avx512 => "AVX-512",
        SimdLevel::Avx512Vnni => "AVX-512+VNNI",
    }
}

// ═══════════════════════ 矩阵×向量 (核心热路径) ═══════════════════════

/// 矩阵×向量: y[i] = Σ_j W[i,j] * x[j]
/// 推理90%时间在这里
pub fn mat_vec_f32(weight: &[f32], input: &[f32], out_dim: usize, in_dim: usize) -> Vec<f32> {
    // 运行时分发到带 target_feature 的函数
    if is_x86_feature_detected!("avx512f") {
        unsafe { mat_vec_f32_avx512(weight, input, out_dim, in_dim) }
    } else if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        unsafe { mat_vec_f32_avx2(weight, input, out_dim, in_dim) }
    } else if is_x86_feature_detected!("sse4.2") {
        unsafe { mat_vec_f32_sse42(weight, input, out_dim, in_dim) }
    } else {
        mat_vec_f32_scalar(weight, input, out_dim, in_dim)
    }
}

/// 标量兜底 — 任何CPU都能跑, 循环展开4x
pub fn mat_vec_f32_scalar(weight: &[f32], input: &[f32], out_dim: usize, in_dim: usize) -> Vec<f32> {
    let mut output = vec![0.0f32; out_dim];
    for i in 0..out_dim {
        let row = &weight[i * in_dim..];
        let mut sum0 = 0.0f32; let mut sum1 = 0.0f32;
        let mut sum2 = 0.0f32; let mut sum3 = 0.0f32;
        let j_max = in_dim - (in_dim % 4);
        let mut j = 0;
        while j < j_max {
            sum0 += row.get(j).copied().unwrap_or(0.0) * input.get(j).copied().unwrap_or(0.0);
            sum1 += row.get(j+1).copied().unwrap_or(0.0) * input.get(j+1).copied().unwrap_or(0.0);
            sum2 += row.get(j+2).copied().unwrap_or(0.0) * input.get(j+2).copied().unwrap_or(0.0);
            sum3 += row.get(j+3).copied().unwrap_or(0.0) * input.get(j+3).copied().unwrap_or(0.0);
            j += 4;
        }
        let mut sum = sum0 + sum1 + sum2 + sum3;
        for j in j_max..in_dim {
            sum += row.get(j).copied().unwrap_or(0.0) * input.get(j).copied().unwrap_or(0.0);
        }
        output[i] = sum;
    }
    output
}

#[target_feature(enable = "avx2,fma")]
unsafe fn mat_vec_f32_avx2(weight: &[f32], input: &[f32], out_dim: usize, in_dim: usize) -> Vec<f32> {
    let mut output = vec![0.0f32; out_dim];
    let in_dim_aligned = in_dim - (in_dim % 32);
    for i in 0..out_dim {
        let row = &weight[i * in_dim..];
        let mut acc0 = _mm256_setzero_ps();
        let mut acc1 = _mm256_setzero_ps();
        let mut acc2 = _mm256_setzero_ps();
        let mut acc3 = _mm256_setzero_ps();
        let mut j = 0;
        while j < in_dim_aligned {
            if j + 128 < in_dim {
                _mm_prefetch(row.as_ptr().add(j + 128) as *const i8, _MM_HINT_T0);
            }
            acc0 = _mm256_fmadd_ps(_mm256_loadu_ps(row.as_ptr().add(j)), _mm256_loadu_ps(input.as_ptr().add(j)), acc0);
            acc1 = _mm256_fmadd_ps(_mm256_loadu_ps(row.as_ptr().add(j+8)), _mm256_loadu_ps(input.as_ptr().add(j+8)), acc1);
            acc2 = _mm256_fmadd_ps(_mm256_loadu_ps(row.as_ptr().add(j+16)), _mm256_loadu_ps(input.as_ptr().add(j+16)), acc2);
            acc3 = _mm256_fmadd_ps(_mm256_loadu_ps(row.as_ptr().add(j+24)), _mm256_loadu_ps(input.as_ptr().add(j+24)), acc3);
            j += 32;
        }
        let acc = _mm256_add_ps(_mm256_add_ps(acc0, acc1), _mm256_add_ps(acc2, acc3));
        let mut sum = hsum_avx2(acc);
        for j in in_dim_aligned..in_dim {
            sum += *row.get_unchecked(j) * *input.get_unchecked(j);
        }
        output[i] = sum;
    }
    output
}

#[target_feature(enable = "avx512f")]
unsafe fn mat_vec_f32_avx512(weight: &[f32], input: &[f32], out_dim: usize, in_dim: usize) -> Vec<f32> {
    let mut output = vec![0.0f32; out_dim];
    let in_dim_aligned = in_dim - (in_dim % 64);
    for i in 0..out_dim {
        let row = &weight[i * in_dim..];
        let mut acc0 = _mm512_setzero_ps();
        let mut acc1 = _mm512_setzero_ps();
        let mut acc2 = _mm512_setzero_ps();
        let mut acc3 = _mm512_setzero_ps();
        let mut j = 0;
        while j < in_dim_aligned {
            if j + 256 < in_dim { _mm_prefetch(row.as_ptr().add(j + 256) as *const i8, _MM_HINT_T0); }
            acc0 = _mm512_fmadd_ps(_mm512_loadu_ps(row.as_ptr().add(j)), _mm512_loadu_ps(input.as_ptr().add(j)), acc0);
            acc1 = _mm512_fmadd_ps(_mm512_loadu_ps(row.as_ptr().add(j+16)), _mm512_loadu_ps(input.as_ptr().add(j+16)), acc1);
            acc2 = _mm512_fmadd_ps(_mm512_loadu_ps(row.as_ptr().add(j+32)), _mm512_loadu_ps(input.as_ptr().add(j+32)), acc2);
            acc3 = _mm512_fmadd_ps(_mm512_loadu_ps(row.as_ptr().add(j+48)), _mm512_loadu_ps(input.as_ptr().add(j+48)), acc3);
            j += 64;
        }
        let acc = _mm512_add_ps(_mm512_add_ps(acc0, acc1), _mm512_add_ps(acc2, acc3));
        let mut sum = _mm512_reduce_add_ps(acc);
        for j in in_dim_aligned..in_dim { sum += *row.get_unchecked(j) * *input.get_unchecked(j); }
        output[i] = sum;
    }
    output
}

#[target_feature(enable = "sse4.2")]
unsafe fn mat_vec_f32_sse42(weight: &[f32], input: &[f32], out_dim: usize, in_dim: usize) -> Vec<f32> {
    let mut output = vec![0.0f32; out_dim];
    let in_dim_aligned = in_dim - (in_dim % 16);
    for i in 0..out_dim {
        let row = &weight[i * in_dim..];
        let mut acc0 = _mm_setzero_ps(); let mut acc1 = _mm_setzero_ps();
        let mut acc2 = _mm_setzero_ps(); let mut acc3 = _mm_setzero_ps();
        let mut j = 0;
        while j < in_dim_aligned {
            acc0 = _mm_add_ps(_mm_mul_ps(_mm_loadu_ps(row.as_ptr().add(j)), _mm_loadu_ps(input.as_ptr().add(j))), acc0);
            acc1 = _mm_add_ps(_mm_mul_ps(_mm_loadu_ps(row.as_ptr().add(j+4)), _mm_loadu_ps(input.as_ptr().add(j+4))), acc1);
            acc2 = _mm_add_ps(_mm_mul_ps(_mm_loadu_ps(row.as_ptr().add(j+8)), _mm_loadu_ps(input.as_ptr().add(j+8))), acc2);
            acc3 = _mm_add_ps(_mm_mul_ps(_mm_loadu_ps(row.as_ptr().add(j+12)), _mm_loadu_ps(input.as_ptr().add(j+12))), acc3);
            j += 16;
        }
        let acc = _mm_add_ps(_mm_add_ps(acc0, acc1), _mm_add_ps(acc2, acc3));
        let mut sum = hsum_sse(acc);
        for j in in_dim_aligned..in_dim { sum += *row.get_unchecked(j) * *input.get_unchecked(j); }
        output[i] = sum;
    }
    output
}

// ═══════════════════════ 水平求和 ═══════════════════════

#[target_feature(enable = "avx2")]
#[inline]
unsafe fn hsum_avx2(v: __m256) -> f32 {
    let hi = _mm256_extractf128_ps(v, 1);
    let lo = _mm256_castps256_ps128(v);
    hsum_sse(_mm_add_ps(lo, hi))
}

#[target_feature(enable = "sse4.2")]
#[inline]
unsafe fn hsum_sse(v: __m128) -> f32 {
    let shuf = _mm_movehdup_ps(v);
    let sums = _mm_add_ps(v, shuf);
    let shuf2 = _mm_movehl_ps(shuf, sums);
    _mm_cvtss_f32(_mm_add_ss(sums, shuf2))
}

// ═══════════════════════ RMSNorm SIMD ═══════════════════════

pub fn rms_norm_simd(x: &mut [f32], gamma: &[f32], eps: f32) {
    if x.is_empty() { return; }
    if is_x86_feature_detected!("avx512f") {
        unsafe { rms_norm_avx512(x, gamma, eps) }
    } else if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        unsafe { rms_norm_avx2(x, gamma, eps) }
    } else if is_x86_feature_detected!("sse4.2") {
        unsafe { rms_norm_sse42(x, gamma, eps) }
    } else {
        rms_norm_scalar(x, gamma, eps)
    }
}

pub fn rms_norm_scalar(x: &mut [f32], gamma: &[f32], eps: f32) {
    let n = x.len();
    let ss: f32 = x.iter().map(|v| v * v).sum::<f32>() / n as f32;
    let inv_rms = 1.0 / (ss + eps).sqrt();
    for i in 0..n { x[i] = x[i] * inv_rms * gamma.get(i).copied().unwrap_or(1.0); }
}

#[target_feature(enable = "avx2,fma")]
unsafe fn rms_norm_avx2(x: &mut [f32], gamma: &[f32], eps: f32) {
    let n = x.len();
    let na = n - (n % 8);
    let mut sv = _mm256_setzero_ps();
    let mut j = 0;
    while j < na { let xv = _mm256_loadu_ps(x.as_ptr().add(j)); sv = _mm256_fmadd_ps(xv, xv, sv); j += 8; }
    let mut ss = hsum_avx2(sv);
    for j in na..n { ss += x[j] * x[j]; }
    ss /= n as f32;
    let ir = 1.0 / (ss + eps).sqrt();
    let irv = _mm256_set1_ps(ir);
    j = 0;
    while j < na {
        let xv = _mm256_loadu_ps(x.as_ptr().add(j));
        let gv = _mm256_loadu_ps(gamma.as_ptr().add(j));
        _mm256_storeu_ps(x.as_mut_ptr().add(j), _mm256_mul_ps(_mm256_mul_ps(xv, irv), gv));
        j += 8;
    }
    for j in na..n { x[j] = x[j] * ir * gamma.get(j).copied().unwrap_or(1.0); }
}

#[target_feature(enable = "avx512f")]
unsafe fn rms_norm_avx512(x: &mut [f32], gamma: &[f32], eps: f32) {
    let n = x.len();
    let na = n - (n % 16);
    let mut sv = _mm512_setzero_ps();
    let mut j = 0;
    while j < na { let xv = _mm512_loadu_ps(x.as_ptr().add(j)); sv = _mm512_fmadd_ps(xv, xv, sv); j += 16; }
    let mut ss = _mm512_reduce_add_ps(sv);
    for j in na..n { ss += x[j] * x[j]; }
    ss /= n as f32;
    let ir = 1.0 / (ss + eps).sqrt();
    let irv = _mm512_set1_ps(ir);
    j = 0;
    while j < na {
        let xv = _mm512_loadu_ps(x.as_ptr().add(j));
        let gv = _mm512_loadu_ps(gamma.as_ptr().add(j));
        _mm512_storeu_ps(x.as_mut_ptr().add(j), _mm512_mul_ps(_mm512_mul_ps(xv, irv), gv));
        j += 16;
    }
    for j in na..n { x[j] = x[j] * ir * gamma.get(j).copied().unwrap_or(1.0); }
}

#[target_feature(enable = "sse4.2")]
unsafe fn rms_norm_sse42(x: &mut [f32], gamma: &[f32], eps: f32) {
    let n = x.len();
    let na = n - (n % 4);
    let mut sv = _mm_setzero_ps();
    let mut j = 0;
    while j < na { let xv = _mm_loadu_ps(x.as_ptr().add(j)); sv = _mm_add_ps(_mm_mul_ps(xv, xv), sv); j += 4; }
    let mut ss = hsum_sse(sv);
    for j in na..n { ss += x[j] * x[j]; }
    ss /= n as f32;
    let ir = 1.0 / (ss + eps).sqrt();
    let irv = _mm_set1_ps(ir);
    j = 0;
    while j < na {
        let xv = _mm_loadu_ps(x.as_ptr().add(j));
        let gv = _mm_loadu_ps(gamma.as_ptr().add(j));
        _mm_storeu_ps(x.as_mut_ptr().add(j), _mm_mul_ps(_mm_mul_ps(xv, irv), gv));
        j += 4;
    }
    for j in na..n { x[j] = x[j] * ir * gamma.get(j).copied().unwrap_or(1.0); }
}

// ═══════════════════════ Softmax SIMD ═══════════════════════

pub fn softmax_simd(x: &mut [f32]) {
    if x.is_empty() { return; }
    if is_x86_feature_detected!("avx512f") {
        unsafe { softmax_avx512(x) }
    } else if is_x86_feature_detected!("avx2") {
        unsafe { softmax_avx2(x) }
    } else {
        softmax_scalar(x)
    }
}

pub fn softmax_scalar(x: &mut [f32]) {
    if x.is_empty() { return; }
    let max = x.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
    let sum: f32 = x.iter().map(|v| (*v - max).exp()).sum();
    if sum > 0.0 { for v in x.iter_mut() { *v = (*v - max).exp() / sum; } }
}

#[target_feature(enable = "avx2")]
unsafe fn softmax_avx2(x: &mut [f32]) {
    let n = x.len(); let na = n - (n % 8);
    let mut mv = _mm256_set1_ps(f32::NEG_INFINITY); let mut j = 0;
    while j < na { mv = _mm256_max_ps(mv, _mm256_loadu_ps(x.as_ptr().add(j))); j += 8; }
    let mut max_val = hmax_avx2(mv);
    for j in na..n { max_val = max_val.max(x[j]); }
    let mb = _mm256_set1_ps(max_val); let mut sv = _mm256_setzero_ps();
    j = 0;
    while j < na {
        let ev = exp_ps_avx2(_mm256_sub_ps(_mm256_loadu_ps(x.as_ptr().add(j)), mb));
        _mm256_storeu_ps(x.as_mut_ptr().add(j), ev);
        sv = _mm256_add_ps(sv, ev);
        j += 8;
    }
    let mut sum = hsum_avx2(sv);
    for j in na..n { let e = (x[j] - max_val).exp(); x[j] = e; sum += e; }
    if sum > 0.0 {
        let inv = _mm256_set1_ps(1.0 / sum); j = 0;
        while j < na { _mm256_storeu_ps(x.as_mut_ptr().add(j), _mm256_mul_ps(_mm256_loadu_ps(x.as_ptr().add(j)), inv)); j += 8; }
        for j in na..n { x[j] /= sum; }
    }
}

#[target_feature(enable = "avx512f")]
unsafe fn softmax_avx512(x: &mut [f32]) {
    let n = x.len(); let na = n - (n % 16);
    let mut mv = _mm512_set1_ps(f32::NEG_INFINITY); let mut j = 0;
    while j < na { mv = _mm512_max_ps(mv, _mm512_loadu_ps(x.as_ptr().add(j))); j += 16; }
    let mut max_val = _mm512_reduce_max_ps(mv);
    for j in na..n { max_val = max_val.max(x[j]); }
    let mb = _mm512_set1_ps(max_val); let mut sv = _mm512_setzero_ps();
    j = 0;
    while j < na {
        let ev = exp_ps_avx512(_mm512_sub_ps(_mm512_loadu_ps(x.as_ptr().add(j)), mb));
        _mm512_storeu_ps(x.as_mut_ptr().add(j), ev);
        sv = _mm512_add_ps(sv, ev);
        j += 16;
    }
    let mut sum = _mm512_reduce_add_ps(sv);
    for j in na..n { let e = (x[j] - max_val).exp(); x[j] = e; sum += e; }
    if sum > 0.0 {
        let inv = _mm512_set1_ps(1.0 / sum); j = 0;
        while j < na { _mm512_storeu_ps(x.as_mut_ptr().add(j), _mm512_mul_ps(_mm512_loadu_ps(x.as_ptr().add(j)), inv)); j += 16; }
        for j in na..n { x[j] /= sum; }
    }
}

// ═══════════════════════ 向量化exp (Horner多项式逼近) ═══════════════════════

#[target_feature(enable = "avx2")]
unsafe fn exp_ps_avx2(x: __m256) -> __m256 {
    let ln2 = _mm256_set1_ps(std::f32::consts::LN_2);
    let inv_ln2 = _mm256_set1_ps(1.0f32 / std::f32::consts::LN_2);
    let one = _mm256_set1_ps(1.0);
    let fx = _mm256_mul_ps(x, inv_ln2);
    let fx = _mm256_add_ps(fx, _mm256_set1_ps(0.5));
    let fx_floor = _mm256_floor_ps(fx);
    let pow2k = _mm256_castsi256_ps(_mm256_add_epi32(_mm256_cvttps_epi32(fx_floor), _mm256_set1_epi32(127i32 << 23)));
    let r = _mm256_fnmadd_ps(fx_floor, ln2, x);
    let c1 = _mm256_set1_ps(1.0/2.0); let c2 = _mm256_set1_ps(1.0/6.0);
    let c3 = _mm256_set1_ps(1.0/24.0); let c4 = _mm256_set1_ps(1.0/120.0);
    let c5 = _mm256_set1_ps(1.0/720.0);
    let mut p = _mm256_fmadd_ps(r, c5, c4);
    p = _mm256_fmadd_ps(r, p, c3); p = _mm256_fmadd_ps(r, p, c2);
    p = _mm256_fmadd_ps(r, p, c1); p = _mm256_fmadd_ps(r, p, one);
    _mm256_mul_ps(p, pow2k)
}

#[target_feature(enable = "avx512f")]
unsafe fn exp_ps_avx512(x: __m512) -> __m512 {
    let ln2 = _mm512_set1_ps(std::f32::consts::LN_2);
    let inv_ln2 = _mm512_set1_ps(1.0f32 / std::f32::consts::LN_2);
    let one = _mm512_set1_ps(1.0);
    let fx = _mm512_mul_ps(x, inv_ln2);
    // _mm512_roundscale_ps with imm8=0x08: round toward -inf (floor), scale=0 (no scaling)
    // imm8 bits: [7:4]=0 (no scale), [3:0]=1 (round to nearest) — but we need floor
    // For exp, rounding to nearest is fine, then we adjust
    let fx_floor = _mm512_roundscale_ps(fx, 0x00);
    let pow2k = _mm512_castsi512_ps(_mm512_add_epi32(_mm512_cvttps_epi32(fx_floor), _mm512_set1_epi32(127i32 << 23)));
    let r = _mm512_fnmadd_ps(fx_floor, ln2, x);
    let c1 = _mm512_set1_ps(1.0/2.0); let c2 = _mm512_set1_ps(1.0/6.0);
    let c3 = _mm512_set1_ps(1.0/24.0); let c4 = _mm512_set1_ps(1.0/120.0);
    let c5 = _mm512_set1_ps(1.0/720.0);
    let mut p = _mm512_fmadd_ps(r, c5, c4);
    p = _mm512_fmadd_ps(r, p, c3); p = _mm512_fmadd_ps(r, p, c2);
    p = _mm512_fmadd_ps(r, p, c1); p = _mm512_fmadd_ps(r, p, one);
    _mm512_mul_ps(p, pow2k)
}

#[target_feature(enable = "avx2")]
unsafe fn hmax_avx2(v: __m256) -> f32 {
    let hi = _mm256_extractf128_ps(v, 1);
    let lo = _mm256_castps256_ps128(v);
    let m128 = _mm_max_ps(lo, hi);
    let shuf = _mm_movehdup_ps(m128);
    let m = _mm_max_ps(m128, shuf);
    let shuf2 = _mm_movehl_ps(shuf, m);
    _mm_cvtss_f32(_mm_max_ss(m, shuf2))
}

// ═══════════════════════ 点积 ═══════════════════════

pub fn dot_product(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len());
    let n = a.len();
    if n == 0 { return 0.0; }
    if is_x86_feature_detected!("avx512f") {
        unsafe { dot_avx512(a, b) }
    } else if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        unsafe { dot_avx2(a, b) }
    } else if is_x86_feature_detected!("sse4.2") {
        unsafe { dot_sse42(a, b) }
    } else {
        a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
    }
}

#[target_feature(enable = "avx2,fma")]
unsafe fn dot_avx2(a: &[f32], b: &[f32]) -> f32 {
    let n = a.len(); let na = n - (n % 8);
    let mut acc = _mm256_setzero_ps(); let mut j = 0;
    while j < na { acc = _mm256_fmadd_ps(_mm256_loadu_ps(a.as_ptr().add(j)), _mm256_loadu_ps(b.as_ptr().add(j)), acc); j += 8; }
    let mut s = hsum_avx2(acc);
    for j in na..n { s += a[j] * b[j]; }
    s
}

#[target_feature(enable = "avx512f")]
unsafe fn dot_avx512(a: &[f32], b: &[f32]) -> f32 {
    let n = a.len(); let na = n - (n % 16);
    let mut acc = _mm512_setzero_ps(); let mut j = 0;
    while j < na { acc = _mm512_fmadd_ps(_mm512_loadu_ps(a.as_ptr().add(j)), _mm512_loadu_ps(b.as_ptr().add(j)), acc); j += 16; }
    let mut s = _mm512_reduce_add_ps(acc);
    for j in na..n { s += a[j] * b[j]; }
    s
}

#[target_feature(enable = "sse4.2")]
unsafe fn dot_sse42(a: &[f32], b: &[f32]) -> f32 {
    let n = a.len(); let na = n - (n % 4);
    let mut acc = _mm_setzero_ps(); let mut j = 0;
    while j < na { acc = _mm_add_ps(_mm_mul_ps(_mm_loadu_ps(a.as_ptr().add(j)), _mm_loadu_ps(b.as_ptr().add(j))), acc); j += 4; }
    let mut s = hsum_sse(acc);
    for j in na..n { s += a[j] * b[j]; }
    s
}

// ═══════════════════════ 加权求和 ═══════════════════════

pub fn weighted_accumulate(result: &mut [f32], score: f32, values: &[f32]) {
    if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        unsafe { wacc_avx2(result, score, values) }
    } else if is_x86_feature_detected!("sse4.2") {
        unsafe { wacc_sse42(result, score, values) }
    } else {
        for d in 0..result.len() { result[d] += score * values[d]; }
    }
}

#[target_feature(enable = "avx2,fma")]
unsafe fn wacc_avx2(result: &mut [f32], score: f32, values: &[f32]) {
    let n = result.len(); let na = n - (n % 8);
    let sv = _mm256_set1_ps(score); let mut d = 0;
    while d < na {
        _mm256_storeu_ps(result.as_mut_ptr().add(d), _mm256_fmadd_ps(sv, _mm256_loadu_ps(values.as_ptr().add(d)), _mm256_loadu_ps(result.as_ptr().add(d))));
        d += 8;
    }
    for d in na..n { result[d] += score * values[d]; }
}

#[target_feature(enable = "sse4.2")]
unsafe fn wacc_sse42(result: &mut [f32], score: f32, values: &[f32]) {
    let n = result.len(); let na = n - (n % 4);
    let sv = _mm_set1_ps(score); let mut d = 0;
    while d < na {
        _mm_storeu_ps(result.as_mut_ptr().add(d), _mm_add_ps(_mm_mul_ps(sv, _mm_loadu_ps(values.as_ptr().add(d))), _mm_loadu_ps(result.as_ptr().add(d))));
        d += 4;
    }
    for d in na..n { result[d] += score * values[d]; }
}

// ═══════════════════════ SiLU ═══════════════════════

pub fn silu_simd(x: &mut [f32]) {
    if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        unsafe { silu_avx2(x) }
    } else {
        for v in x.iter_mut() { *v = *v / (1.0 + (-*v).exp()); }
    }
}

#[target_feature(enable = "avx2,fma")]
unsafe fn silu_avx2(x: &mut [f32]) {
    let n = x.len(); let na = n - (n % 8);
    let one = _mm256_set1_ps(1.0); let mut j = 0;
    while j < na {
        let xv = _mm256_loadu_ps(x.as_ptr().add(j));
        let neg_x = _mm256_sub_ps(_mm256_setzero_ps(), xv);
        let sig = _mm256_div_ps(one, _mm256_add_ps(one, exp_ps_avx2(neg_x)));
        _mm256_storeu_ps(x.as_mut_ptr().add(j), _mm256_mul_ps(xv, sig));
        j += 8;
    }
    for j in na..n { x[j] = x[j] / (1.0 + (-x[j]).exp()); }
}

// ═══════════════════════ 边解边算 ═══════════════════════

/// INT8 量化权重 边解量化边矩阵×向量 (省中间buffer)
pub fn qmat_vec_int8_inline(
    data: &[u8], scale: &[f32], zero_point: &[i8],
    input: &[f32], out_dim: usize, in_dim: usize,
) -> Vec<f32> {
    let mut output = vec![0.0f32; out_dim];
    for i in 0..out_dim {
        let ch = i.min(scale.len().saturating_sub(1));
        let s = scale.get(ch).copied().unwrap_or(0.01);
        let zp = zero_point.get(ch).copied().unwrap_or(127) as f32;
        let mut sum = 0.0f32;
        for j in 0..in_dim {
            let idx = i * in_dim + j;
            if idx < data.len() && j < input.len() {
                sum += (data[idx] as f32 - zp) * s * input[j];
            }
        }
        output[i] = sum;
    }
    output
}

/// INT4 量化权重 边解量化边矩阵×向量
pub fn qmat_vec_int4_inline(
    data: &[u8], scale: &[f32], zero_point: &[i8],
    input: &[f32], out_dim: usize, in_dim: usize,
) -> Vec<f32> {
    let mut output = vec![0.0f32; out_dim];
    for i in 0..out_dim {
        let ch = i.min(scale.len().saturating_sub(1));
        let s = scale.get(ch).copied().unwrap_or(0.02);
        let zp = zero_point.get(ch).copied().unwrap_or(8) as f32;
        let mut sum = 0.0f32;
        for j in (0..in_dim).step_by(2) {
            let byte_idx = (i * in_dim + j) / 2;
            if byte_idx >= data.len() { break; }
            let byte = data[byte_idx];
            sum += (byte & 0x0F) as f32 * s * input.get(j).copied().unwrap_or(0.0)
                 - zp * s * input.get(j).copied().unwrap_or(0.0);
            if j + 1 < in_dim {
                sum += ((byte >> 4) & 0x0F) as f32 * s * input.get(j+1).copied().unwrap_or(0.0)
                     - zp * s * input.get(j+1).copied().unwrap_or(0.0);
            }
        }
        output[i] = sum;
    }
    output
}

// ═══════════════════════ 性能基准 ═══════════════════════

pub fn run_simd_benchmark() -> String {
    let level = detect_simd_level();
    let mut r = String::new();
    r.push_str(&format!("[SIMD] CPU 特性级别: {}\n", simd_level_name(level)));

    let sizes = [(512, 512), (896, 896), (1408, 512)];
    for &(od, id) in &sizes {
        let w: Vec<f32> = (0..od*id).map(|i| (i as f32 * 0.0001 - 0.5)).collect();
        let x: Vec<f32> = (0..id).map(|i| (i as f32 * 0.001)).collect();
        let t = std::time::Instant::now();
        for _ in 0..10 { let _ = mat_vec_f32(&w, &x, od, id); }
        let e = t.elapsed();
        let gf = 2.0 * od as f64 * id as f64 * 10.0 / e.as_secs_f64() / 1e9;
        r.push_str(&format!("[SIMD] mat_vec ({}×{}) : {:.2} GFLOPS\n", od, id, gf));
    }

    let n = 1536;
    let x: Vec<f32> = (0..n).map(|i| (i as f32 * 0.01 - 7.5)).collect();
    let g: Vec<f32> = vec![1.0f32; n];
    let t = std::time::Instant::now();
    for _ in 0..1000 { let mut c = x.clone(); rms_norm_simd(&mut c, &g, 1e-5); }
    r.push_str(&format!("[SIMD] rms_norm (n={}) : {:.2} µs/call\n", n, t.elapsed().as_micros() as f64 / 1000.0));

    let s: Vec<f32> = (0..512).map(|i| (i as f32 * 0.01 - 2.5)).collect();
    let t = std::time::Instant::now();
    for _ in 0..1000 { let mut c = s.clone(); softmax_simd(&mut c); }
    r.push_str(&format!("[SIMD] softmax (n=512) : {:.2} µs/call\n", t.elapsed().as_micros() as f64 / 1000.0));

    let a: Vec<f32> = (0..64).map(|i| (i as f32 * 0.1)).collect();
    let b: Vec<f32> = (0..64).map(|i| ((i+1) as f32 * 0.1)).collect();
    let t = std::time::Instant::now();
    for _ in 0..10000 { let _ = dot_product(&a, &b); }
    r.push_str(&format!("[SIMD] dot_product (n=64) : {:.2} ns/call\n", t.elapsed().as_nanos() as f64 / 10000.0));

    r
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simd_detection() {
        let level = detect_simd_level();
        println!("[SIMD] 检测到级别: {}", simd_level_name(level));
    }

    #[test]
    fn test_mat_vec_correctness() {
        let (od, id) = (16usize, 32usize);
        let w: Vec<f32> = (0..od*id).map(|i| (i as f32 * 0.01)).collect();
        let x: Vec<f32> = (0..id).map(|i| (i as f32 * 0.1)).collect();
        let rs = mat_vec_f32_scalar(&w, &x, od, id);
        let rv = mat_vec_f32(&w, &x, od, id);
        for i in 0..od {
            let d = (rs[i] - rv[i]).abs();
            assert!(d < 1e-3, "行{}: scalar={}, simd={}, diff={}", i, rs[i], rv[i], d);
        }
    }

    #[test]
    fn test_rms_norm_correctness() {
        let mut xs = vec![1.0f32, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
        let mut xv = xs.clone();
        let g = vec![1.0f32; 8];
        rms_norm_scalar(&mut xs, &g, 1e-5);
        rms_norm_simd(&mut xv, &g, 1e-5);
        for i in 0..8 { assert!((xs[i] - xv[i]).abs() < 1e-4, "pos {}", i); }
    }

    #[test]
    fn test_softmax_correctness() {
        let mut xs = vec![1.0f32, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
        let mut xv = xs.clone();
        softmax_scalar(&mut xs);
        softmax_simd(&mut xv);
        assert!((xs.iter().sum::<f32>() - 1.0).abs() < 1e-4);
        assert!((xv.iter().sum::<f32>() - 1.0).abs() < 1e-4);
        for i in 0..8 { assert!((xs[i] - xv[i]).abs() < 1e-3, "pos {}", i); }
    }

    #[test]
    fn test_dot_product() {
        let a = vec![1.0f32, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
        let b = vec![8.0f32, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0];
        let s: f32 = a.iter().zip(&b).map(|(x, y)| x * y).sum();
        let d = dot_product(&a, &b);
        assert!((s - d).abs() < 1e-4, "scalar={}, simd={}", s, d);
    }
}
