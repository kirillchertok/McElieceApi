class McElieceCipher {
  constructor(n = 64, k = 32, t = 3) {
    this.n = n;
    this.k = k;
    this.t = t;
    
    this.G = null;
    this.S = null;
    this.S_inv = null;
    this.P = null;
    this.P_inv = null;
    this.H = null;
    this.syndromeTable = null;
    
    this.initialize();
  }

  initialize() {
    this.G = this.generateSystematicG(this.k, this.n);
    const { M: S, inv: S_inv } = this.randomInvertibleMatrix(this.k);
    const { perm: P, inv: P_inv } = this.randomPermutation(this.n);
    
    this.S = S;
    this.S_inv = S_inv;
    this.P = P;
    this.P_inv = P_inv;
    
    const SG = this.matMul(S, this.G);
    const G1 = this.zeros(this.k, this.n);
    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < this.n; j++) {
        G1[i][j] = SG[i][P[j]];
      }
    }
    this.G1 = G1;
    
    this.H = this.parityCheckFromG(this.G, this.k, this.n);
    this.syndromeTable = this.buildSyndromeTable(this.H, this.n, this.t);
  }

  randBit() {
    return Math.random() < 0.5 ? 1 : 0;
  }

  zeros(rows, cols) {
    const m = new Array(rows);
    for (let i = 0; i < rows; i++) {
      m[i] = new Array(cols).fill(0);
    }
    return m;
  }

  matMul(A, B) {
    const rows = A.length;
    const colsB = B[0].length;
    const colsA = A[0].length;
    const C = this.zeros(rows, colsB);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < colsB; j++) {
        let s = 0;
        for (let r = 0; r < colsA; r++) {
          s ^= A[i][r] & B[r][j];
        }
        C[i][j] = s;
      }
    }
    return C;
  }

  rowMulVecMat(row, mat) {
    const cols = mat[0].length;
    const L = row.length;
    const out = new Array(cols).fill(0);

    for (let j = 0; j < cols; j++) {
      let s = 0;
      for (let i = 0; i < L; i++) {
        s ^= row[i] & mat[i][j];
      }
      out[j] = s;
    }
    return out;
  }

  matMulVec(mat, vec) {
    const rows = mat.length;
    const cols = mat[0].length;
    const out = new Array(rows).fill(0);

    for (let i = 0; i < rows; i++) {
      let s = 0;
      for (let j = 0; j < cols; j++) {
        s ^= mat[i][j] & vec[j];
      }
      out[i] = s;
    }
    return out;
  }

  invertBinaryMatrix(A) {
    const n = A.length;
    const M = this.zeros(n, 2 * n);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) M[i][j] = A[i][j];
      M[i][n + i] = 1;
    }

    let row = 0;
    for (let col = 0; col < n; col++) {
      let sel = -1;
      for (let r = row; r < n; r++) {
        if (M[r][col] === 1) {
          sel = r;
          break;
        }
      }
      if (sel === -1) continue;

      if (sel !== row) {
        const tmp = M[sel];
        M[sel] = M[row];
        M[row] = tmp;
      }

      for (let r = 0; r < n; r++) {
        if (r !== row && M[r][col] === 1) {
          for (let c = col; c < 2 * n; c++) {
            M[r][c] ^= M[row][c];
          }
        }
      }
      row++;
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if ((i === j && M[i][j] !== 1) || (i !== j && M[i][j] !== 0)) return null;
      }
    }

    const inv = this.zeros(n, n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) inv[i][j] = M[i][n + j];
    return inv;
  }

  randomInvertibleMatrix(k) {
    for (;;) {
      const M = this.zeros(k, k);
      for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) M[i][j] = this.randBit();
      const inv = this.invertBinaryMatrix(M);
      if (inv) return { M, inv };
    }
  }

  randomPermutation(n) {
    const perm = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    const inv = new Array(n);
    for (let i = 0; i < n; i++) inv[perm[i]] = i;
    return { perm, inv };
  }

  applyInversePermutation(v, inv) {
    const o = new Array(v.length);
    for (let j = 0; j < v.length; j++) o[j] = v[inv[j]];
    return o;
  }

  generateSystematicG(k, n) {
    const Qcols = n - k;
    const G = this.zeros(k, n);

    for (let i = 0; i < k; i++) G[i][i] = 1;
    for (let i = 0; i < k; i++) for (let j = 0; j < Qcols; j++) G[i][k + j] = this.randBit();

    return G;
  }

  parityCheckFromG(G, k, n) {
    const Qcols = n - k;
    const H = this.zeros(Qcols, n);

    for (let i = 0; i < Qcols; i++) {
      for (let j = 0; j < k; j++) H[i][j] = G[j][k + i];
      H[i][k + i] = 1;
    }
    return H;
  }

  xorVectors(a, b) {
    const o = new Array(a.length);
    for (let i = 0; i < a.length; i++) o[i] = a[i] ^ b[i];
    return o;
  }

  combinationsIndices(n, w) {
    const res = [];
    function rec(s, l, c) {
      if (l === 0) {
        res.push(c.slice());
        return;
      }
      for (let i = s; i <= n - l; i++) {
        c.push(i);
        rec(i + 1, l - 1, c);
        c.pop();
      }
    }
    rec(0, w, []);
    return res;
  }

  buildSyndromeTable(H, n, t) {
    const r = H.length;
    const m = new Map();
    const z = new Array(r).fill(0);
    m.set(z.join(''), new Array(n).fill(0));

    for (let w = 1; w <= t; w++) {
      const combs = this.combinationsIndices(n, w);
      for (const comb of combs) {
        const e = new Array(n).fill(0);
        for (const idx of comb) e[idx] = 1;
        const s = this.matMulVec(H, e);
        m.set(s.join(''), e);
      }
    }
    return m;
  }

  textToBitsUtf8(str) {
    const buf = Buffer.from(str, 'utf8');
    const bits = [];
    for (let b of buf) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
    return bits;
  }

  bitsToBuffer(bits) {
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) {
        const bit = (i + j < bits.length) ? bits[i + j] : 0;
        byte = (byte << 1) | bit;
      }
      bytes.push(byte);
    }
    return Buffer.from(bytes);
  }

  bitsToUtf8String(bits) {
    const buf = this.bitsToBuffer(bits);
    return buf.toString('utf8').replace(/\0+$/, '');
  }

  randomErrorVector(n, t) {
    const w = Math.floor(Math.random() * (t + 1));
    const idxs = [];
    const used = new Set();

    while (idxs.length < w) {
      const r = Math.floor(Math.random() * n);
      if (!used.has(r)) {
        used.add(r);
        idxs.push(r);
      }
    }
    const e = new Array(n).fill(0);
    for (const i of idxs) e[i] = 1;
    return e;
  }

  extractMessageFromCodeword(v, k) {
    return v.slice(0, k);
  }

  multiplyRowByMatrixRowMajor(row, mat) {
    return this.rowMulVecMat(row, mat);
  }

  async encrypt(plaintext) {
    const bits = this.textToBitsUtf8(plaintext);

    const blocks = [];
    for (let i = 0; i < bits.length; i += this.k) {
      const b = bits.slice(i, i + this.k);
      while (b.length < this.k) b.push(0);
      blocks.push(b);
    }

    const cipherBits = [];
    for (const m of blocks) {
      const cNoErr = this.rowMulVecMat(m, this.G1);
      const z = this.randomErrorVector(this.n, this.t);
      const c = this.xorVectors(cNoErr, z);
      cipherBits.push(...c);
    }

    return this.bitsToBuffer(cipherBits);
  }

  async decrypt(cipherData) {
    const cipherBits = [];
    for (let byte of cipherData) {
      for (let i = 7; i >= 0; i--) {
        cipherBits.push((byte >> i) & 1);
      }
    }

    const cipherBlocks = [];
    for (let i = 0; i < cipherBits.length; i += this.n) {
      const b = cipherBits.slice(i, i + this.n);
      while (b.length < this.n) b.push(0);
      cipherBlocks.push(b);
    }

    const recBits = [];
    for (const c of cipherBlocks) {
      const c1 = this.applyInversePermutation(c, this.P_inv);
      const s = this.matMulVec(this.H, c1);
      const e = this.syndromeTable.get(s.join('')) || new Array(this.n).fill(0);
      const v = this.xorVectors(c1, e);
      const mS = this.extractMessageFromCodeword(v, this.k);
      const m = this.multiplyRowByMatrixRowMajor(mS, this.S_inv);
      recBits.push(...m);
    }

    return this.bitsToUtf8String(recBits);
  }

  getPublicKey() {
    return {
      G1: this.G1,
      n: this.n,
      k: this.k,
      t: this.t
    };
  }

  getState() {
    return {
      S: this.S,
      S_inv: this.S_inv,
      P: this.P,
      P_inv: this.P_inv,
      G: this.G,
      G1: this.G1,
      H: this.H
    };
  }
}

const cipherInstance = new McElieceCipher();

export default cipherInstance;