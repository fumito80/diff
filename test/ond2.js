
const V_INIT = 0;
const V_X = 1;
const V_Y = 2;
function getV_Status(v_minus, v_plus) {
    if ((v_minus == undefined) && (v_plus == undefined)) { return V_INIT; }
    if (v_minus == undefined) { return V_X; }
    if (v_plus == undefined) { return V_Y; }

    if (v_minus.x < v_plus.x) {
        return V_X;
    } else {
        return V_Y;
    }
}

function getEndPoint(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const offset = n + 1;
    let v = new Array(m + n + 3);

    for (let d = 0; d <= m + n; d++) {
        let k_max = (d <= m) ? d : (m - (d - m));
        let k_min = (d <= n) ? d : (n - (d - n));

        for (let k = -k_min; k <= k_max; k+=2) {
            let index = offset + k;
            let x = 0;
            let y = 0;
            let parent;

            switch(getV_Status(v[index - 1], v[index + 1])) {
            case V_INIT:
                parent = { k, x, y, parent: null };
                break;

            case V_X:
                x = v[index + 1].x;
                y = v[index + 1].y + 1;
                parent = v[index + 1];
                break;

            case V_Y:
                x = v[index - 1].x + 1;
                y = v[index - 1].y;
                parent = v[index - 1];
                break;

            }

            while (x < m && y < n && str1[x] == str2[y]) {
                x++;
                y++;
            }

            v[index] = { k, x, y, parent };

            if (m <= x && n <= y) {
                // console.log(JSON.stringify(v, null, 4));
                console.log(JSON.stringify(v[index], null, 4));
                return v[index];
            }
        }
    }
}

function getDiffStringOND(str1, str2) {
    var point = getEndPoint(str1, str2);
    var diff_string = "";
    while (point.parent != null) {
        var parent = point.parent;
        var diff_x = point.x - parent.x
        var diff_y = point.y - parent.y
        var same_len = Math.min(diff_x, diff_y);

        for (var i = 0; i < same_len; i++) {
            diff_string = str1.charAt(point.x-i-1) + diff_string;
        }

        if (diff_y < diff_x) {
            diff_string = '-' + str1.charAt(parent.x) + diff_string;
        } else  if (diff_x < diff_y) {
            diff_string = '+' + str2.charAt(parent.y) + diff_string;
        // } else {
        //     diff_string = ' ' + diff_string + '\n';
        }

        point = parent;
    }

    return diff_string;
}

const text = 'XABCDA';
const area = 'XBFEABD';

var diff_string = getDiffStringOND(text, area);
// document.getElementById('diff').innerHTML = diff_string;
console.log(diff_string);
