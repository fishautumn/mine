enum Op {
    Dig = 'dig',
    Mark = 'mark',
}

interface Action {
    x: number;
    y: number;
    op: Op;
}

enum GameStatus {
    Working = 'working',
    Success = 'success',
    Failure = 'failure',
};

enum CellStatus {
    Init = ' ',
    Mark = 'F',
};

type CellView = CellStatus | number;

type CellFunc = (Coord, CellStatus) => void;

class GameView {
    status: GameStatus;
    count: number;
    remain: number;
    width: number;
    height: number;
    data: CellView[][];
}

function for_each_cell(view: GameView, func: CellFunc): void {
    for (let y = 0; y < view.height; ++y) {
        const row = view.data[y];
        for (let x = 0; x < view.width; ++x) {
            func({x: x, y: y}, row[x]);
        }
    }
}

function for_each_adjacent(view: GameView, p: Coord, func: CellFunc): void {
    const off = [
        {x:-1, y:-1}, {x:0, y:-1}, {x:1, y:-1},
        {x:-1, y:0}, {x:1, y:0},
        {x:-1, y:+1}, {x:0, y:+1}, {x:1, y:+1}
    ];
    for (const o of off) {
        const x = p.x + o.x;
        const y = p.y + o.y;
        if (0 <= x && x < view.width && 0 <= y && y < view.height) {
            func({x:x, y:y}, view.data[y][x]);
        }
    }
}

/*
x_i \in {0, 1}, a_i > 0
\sum_{i=0}^{n} a_i * x_i = X

X = 0 => \all x_i = 0
X = \sum a_i => \all x_i = 1

x1+x2 = 1
x1+x2+x3 = 2
=> x3 = 2 - 1 = 1

x1+x2+x3 = 1
   x2+x3+x4 = 2
=> x4-x1 = 1 => x4 = 1, x1 = 0

set A, set B has no intersection
max(A - B) = size(A) => \all A 1, \all B 0
min(A - B) = -size(B) => \all A 0, \all B 1

*/

interface Coord {
    x: number;
    y: number;
}

function coord_cmp(p1: Coord, p2: Coord): number {
    let d = p1.y - p2.y;
    return d != 0 ? d : p1.x - p2.x;
}

function str(c: Coord) {
    return `${c.x},${c.y}`
}

class CellSet {
    cells: Coord[];
    sum: number;

    constructor(cells: Coord[], sum: number) {
        this.cells = cells.sort(coord_cmp);
        this.sum = sum;
    }

    is_definitive(): boolean {
        return this.sum == 0 || this.sum == this.cells.length;
    }
}

class DiffResult {
    positive: Coord[];
    negative: Coord[];
    sum: number;

    constructor(s1: CellSet, s2: CellSet) {
        if (s1.sum < s2.sum) {
            const s3 = s1;
            s1 = s2;
            s2 = s3;
        }
        this.positive = [];
        this.negative = [];
        this.sum = s1.sum - s2.sum;

        const l1 = s1.cells.length;
        const l2 = s2.cells.length;
        let i1 = 0;
        let i2 = 0;
        while (i1 < l1 && i2 < l2) {
            const d = coord_cmp(s1.cells[i1], s2.cells[i2])
            if (d < 0) {
                this.positive.push(s1.cells[i1])
                ++i1
            } else if (d > 0) {
                this.negative.push(s2.cells[i2])
                ++i2
            } else {
                ++i1;
                ++i2;
            }
        }
        for (; i1 < l1; ++i1) {
            this.positive.push(s1.cells[i1])
        }
        for (; i2 < l2; ++i2) {
            this.negative.push(s2.cells[i2])
        }
    }

    is_definitive(): boolean {
        return this.sum == this.positive.length || this.sum + this.negative.length == 0;
    }

    make_set(): CellSet {
        const ret = []
        if (this.sum == this.positive.length) {
            if (this.positive.length > 0) {
                ret.push(new CellSet(this.positive, this.sum))
            }
            if (this.negative.length > 0) {
                ret.push(new CellSet(this.negative, 0))
            }
        } else if (this.sum + this.negative.length == 0) {
            if (this.positive.length > 0) {
                ret.push(new CellSet(this.positive, 0))
            }
            if (this.negative.length > 0) {
                ret.push(new CellSet(this.negative, -this.sum))
            }
        }
        return ret
    }
}

function is_init(view: GameView): boolean {
    if (view.remain < view.count) {
        return false
    }
    for (const row of view.data) {
        for (const c of row) {
            if (c != CellStatus.Init) {
                return false
            }
        }
    }
    return true
}

function init_set(view: GameView) {
    const cells = []
    for (let y = 0; y < view.height; ++y) {
        const row = view.data[y]
        for (let x = 0; x < view.width; ++x) {
            const c = row[x]
            if (c === CellStatus.Init) {
                cells.push({x: x, y: y})
            }
        }
    }
    return new CellSet(cells, view.remain)
}

export default function matrix_solve(view: GameView, guess: boolean): Action[] {
    if (view.status != GameStatus.Working) {
        return []
    }

    if (is_init(view)) {
        return [{x: Math.floor(view.width / 2), y: Math.floor(view.height / 2), op: Op.Dig }]
    }

    const sets = []
    sets.push(init_set(view))
    for_each_cell(view, (p: Coord, c: cellStatus) => {
        if (typeof c === "number") {
            const cells = []
            let sum = c
            for_each_adjacent(view, p, (pa, ca) => {
                if (ca === CellStatus.Init) {
                    cells.push(pa)
                } else if (ca == CellStatus.Mark) {
                    --sum
                }
            })
            if (cells.length > 0) {
                sets.push(new CellSet(cells, sum));
            }
        }
    })
    const analyzer = new MatrixAnalyzer(sets)
    let ret = analyzer.analyze();
    if (ret.length == 0 && guess) {
        ret = [find_min_probability(sets)]
    }
    return ret
}

function init_set2(view: GameView) {
    const row = [];
    for (let y = 0; y < view.height; ++y) {
        const row = view.data[y]
        for (let x = 0; x < view.width; ++x) {
            const c = row[x]
            if (c === CellStatus.Init) {
                row[y * view.width + x] = 1;
            }
        }
    }
    row[view.width * view.height] = view.remain;
    return row;
}

export function matrix_solve2(view: GameView, guess: boolean): Action[] {
    if (view.status != GameStatus.Working) {
        return []
    }

    if (is_init(view)) {
        return [{x: Math.floor(view.width / 2), y: Math.floor(view.height / 2), op: Op.Dig }]
    }

    const m = [];
    m.push(init_set2(view));
    for_each_cell(view, (p: Coord, c: cellStatus) => {
        if (typeof c === "number") {
            const row = [];
            let sum = c;
            let cells = 0;
            for_each_adjacent(view, p, (pa, ca) => {
                if (ca === CellStatus.Init) {
                    row[p.y * view.width + p.x] = 1;
                    ++cells;
                } else if (ca == CellStatus.Mark) {
                    --sum
                }
            })
            if (cells > 0) {
                row[view.width * view.height] = sum;
            }
        }
    })
    simplify_matrix(m);
    let ret = analyze_matrix2(m);
    if (ret.length == 0 && guess) {
        ret = matrix_guess2();
    }
    return ret
}

function matrix_guess2(m: number[][], width: number) : Action[] {
    let sel = -1;
    let prob = 100;
    for (const row of m) {
        let max = 0;
        let min = 0;
        let pos = [];
        let neg = [];
        for (let x = 0; x + 1 < row.length; ++x) {
            if (x in row) {
                if (row[x] > 0) {
                    max += row[x];
                    pos.push(x);
                } else if (row[x] < 0) {
                    min += row[x];
                    neg.push(x);
                }
            }
        }
        if (pos.length > 0) {
            // assume all neg are 1's
            let p = (row[row.length - 1] - min) / max;
            if (p < prob) {
                prob = p;
                sel = pos[0];
            }
        }
        if (neg.length > 0) {
            // assume all pos are 1's
            let p = (row[row.length - 1] - max) / min;
            if (p < prob) {
                prob = p;
                sel = neg[0];
            }
        }
    }
    return [{op:Op.Dig, y:Math.round(sel / width), x: sel % width}];
}

function analyze_matrix2(m: number[][], width: number): Action[] {
    const actions = [];
    for (const row of m) {
        let max = 0;
        let min = 0;
        let pos = [];
        let neg = [];
        for (let x = 0; x + 1 < row.length; ++x) {
            if (x in row) {
                if (row[x] > 0) {
                    max += row[x];
                    pos.push(x);
                } else if (row[x] < 0) {
                    min += row[x];
                    neg.push(x);
                }
            }
        }
        if (Math.abs(row[row.length - 1] - max) < Number.EPSILON) {
        } else if (Math.abs(row[row.length - 1] - min) < Number.EPSILON) {
            const t = pos;
            pos = neg;
            neg = t;
        } else {
            continue;
        }
        for (const p of pos) {
            actions.push({op:Op.Mark, y:Math.floor(p / width), x: p % width})
        }
        for (const p of neg) {
            actions.push({op:Op.Dig, y:Math.floor(p / width), x: p % width})
        }
    }
    return actions;
}

function simplify_matrix(m: number[][]): void {
    const h = m.length;
    const w = m[0].length;
    const count = [];
    for (let y = 0; y < h; ++y) {
        let row = m[y];
        let c = 0;
        for (let x = 0; x < w; ++x) {
            if (x in row && row[x] != 0) {
                ++c;
            }
        }
        count.push(c);
    }
    let next_y = 0;
    for (let x = 0; x < w; ++x) {
        let min = w;
        let sel_y = -1;
        const rs = [];
        for (let y = next_y; y < h; ++y) {
            if (m[y][x] != 0) {
                rs.push(y);
                if (count[y] < min) {
                    min = count[y];
                    sel_y = y;
                }
            }
        }
        if (sel_y == -1) {
            continue;
        }
        if (next_y != sel_y) {
            const t = m[next_y];
            m[next_y] = m[sel_y];
            m[sel_y] = t;
            for (let i = 0; i < rs.length; ++i) {
                if (rs[i] == sel_y) {
                    rs[i] = rs[rs.length - 1];
                    rs.length = rs.length - 1;
                    break;
                }
            }
        }
        handle_column(m, x, next_y, rs);
        count[next_y] = x;
        ++next_y;
    }
    for (let y = next_y - 1; y >= 0; --y) {
        handle_column_rev(m, count[y], y);
    }
}

function handle_column_rev(m: number[][], x: number, y: number) {
    const base_row = m[y];
    for (let y1 = 0; y1 < y; ++y1) {
        const row = m[y1];
        row[x] = x in row ? row[x] : 0;
        const factor = base_row[x] == 1 ? row[x] : row[x] / base_row[x];
        row[x] = 0;
        for (let nx = x1; nx < m[x].length; ++nx) {
            if (nx in base_row && base_row[nx] != 0) {
                row[nx] -= base_row[nx] * factor;
            }
        }
    }
}

function handle_column(m: number[][], x: number, y: number, rs: number[]) {
    const w = m[0].length;
    const base_row = m[y];
    for (const ny of rs) {
        const row = m[ny];
        row[x] = x in row ? row[x] : 0;
        const factor = base_row[x] == 1 ? row[x] : row[x] / base_row[x];
        row[x] = 0;
        for (let nx = x + 1; nx < w; ++nx) {
            if (nx in base_row && base_row[nx] != 0) {
                row[nx] -= base_row[nx] * factor;
            }
        }
    }
}

function first_non_zero_index(row: number[]) {
    for (let i = 0; i < row.length; ++i) {
        if (row[i] != 0) {
            return i;
        }
    }
    return -1;
}

class MatrixAnalyzer {
    sets: CellSet[];
    map: Map;

    constructor(sets: CellSet[]) {
        this.sets = sets
        this.dig_set = []
        this.mark_set = []
        this.map = {}
        for (const s of sets) {
            for (const p of s.cells) {
                let a = this.map[str(p)]
                if (a == null) {
                    a = []
                    this.map[str(p)] = a
                }
                a.push(s)
            }
        }
    }

    analyze(): Action[] {
        let updated = true
        while (updated) {
            updated = false
            for (const s of this.sets) {
                if (s.sum > 8) {
                    continue
                }
                const pss = []
                for (const p of s.cells) {
                    for (const ps of this.map[str(p)]) {
                        if (ps === s || ps.sum < s.sum) {
                            continue;
                        }
                        const diff = new DiffResult(ps, s)
                        const ds = diff.make_set();
                        if (ds.length == 0) {
                            continue
                        }
                        for (const c of ps.cells) {
                            if (!ds[0].cells.some(x => x == c)) {
                                const t = this.map[str(c)]
                                this.map[str(c)] = t.filter(x => x !== ps)
                            }
                        }
                        ps.sum = ds[0].sum
                        ps.cells = ds[0].cells
                        if (ds.length == 2) {
                            this.sets.push(ds[1]);
                            for (const c of ds[1].cells) {
                                let a = this.map[str(c)]
                                if (a == null) {
                                    a = []
                                    this.map[str(c)] = a
                                }
                                a.push(s)
                            }
                        }
                        updated = true;
                    }
                }
            }
        }
        const actions = []
        for (const s of this.sets) {
            if (s.sum == 0) {
                for (const p of s.cells) {
                    actions.push({x:p.x, y:p.y, op: Op.Dig})
                }
            } else if (s.sum == s.cells.length) {
                for (const p of s.cells) {
                    actions.push({x:p.x, y:p.y, op: Op.Mark})
                }
            }
        }
        return actions
    }
}

function remove_from<T>(t: T, a: T[]): boolean {
    let i = -1;
    for (; i < a.length; ++i) {
        if (t === a[i]) {
            break;
        }
    }
    const removed = (i < a.length)
    ++i
    for (; i < a.length; ++i) {
        a[i - 1] = a[i];
    }
    return removed
}

function find_min_probability(sets: CellSet[]) {
    const m = [];
    for (const s of sets) {
        const tp = s.sum / s.cells.length;
        for (const c of s.cells) {
            let row;
            if (c.y in m) {
                row = m[c.y];
            } else {
                row = [];
                m[c.y] = row;
            }
            if (c.x in row) {
                if (tp > row[c.x]) {
                    row[c.x] = tp;
                }
            } else {
                row[c.x] = tp;
            }
        }
    }
    let min_p = 2;
    let pt;
    for (const [y, row] of m.entries()) {
        if (row == null) {
            continue;
        }
        for (const [x, p] of row.entries()) {
            if (p != null && p > 0 && p < min_p) {
                min_p = p;
                pt = {x:x, y:y};
            }
        }
    }
    return {x: pt.x, y: pt.y, op: Op.Dig}
}