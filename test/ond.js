function ond(A, B, M, N) {
  function snake(x, y) {       //  対角線が存在する場合は、移動する
    while(x < M && y < N && A[x+1] == B[y+1]) {
      x += 1;
      y += 1;
    }
    return y;
  }
  let V = new Array(M + N + 2 + 1);           //  各対角線の最遠点のｙ座標値
  let x, y, parent, offset = M + N;
  V[1 + offset] = { k: 0, y: 0, parent: null };
  for (let D = 0; D <= M + N; D++) {   //  各Ｄについて
    let k_max = (D <= M) ? D : (M - (D - M));
    let k_min = (D <= N) ? D : (N - (D - N));
    // console.log('D: ' + D);
    for(let k = -k_min; k <= k_max; k += 2) {
      if (k == -D || k != D && V[k - 1 + offset] < V[k + 1 + offset]) {
        parent = V[k + 1 + offset];
        y = V[k + 1 + offset].y;
      } else {
        parent = V[k - 1 + offset];
        y = V[k - 1 + offset].y + 1;
      }
      x = y - k;
      V[k + offset] = { k, y: snake(x, y), parent };
      // console.log(k + ': ' + V[k + offset]);
      if (x >= M && y >= N) {
        return V[k + offset];                         //  found !!!
      }
    }
  }
}

function diff(A, B) {
  return ond(A, B, A.length, B.length);
}

const A = 'ABCDA';
const B = 'BFEABD';

const V = diff(A, B);
console.log(JSON.stringify(V, null, 4));
