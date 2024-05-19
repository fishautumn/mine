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
    Sucess = 'success',
    Failure = 'failure',
}

enum CellStatus {
    Init = ' ',
    Mark = 'F',
}

type CellView = CellStatus | number;

interface GameView {
    status: GameStatus;
    count: number;
    remain: number;
    width: number;
    height: number;
    data: CellView[][];

    for_each_cell(func: (Coord, CellStatus)=>void):void {
        for (let y = 0; y < view.height; ++y) {
            const row = view.data[y]
            for (let x = 0; x < view.width; ++x) {
                func({x: x, y: y}, row[x])
            }
        }
    }

    for_each_adjacent(p: Coord, func： (Coord, CellStatus)=>void):void {
        const off = [{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:-1,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1}];
        for (const o of off) {
            const x = p.x + o.x
            const y = p.y + o.y
            if (0 <= x && x < this.width && 0 <= y && y <= this.height) {
                func({x:x, y:y}, this.data[y][x])
            }
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

    cmp(that: Coord): number => {
        let d = this.y - that.y;
        return d != 0 ? d : this.x - that.y;
    }

    str(): string => {
        return `${this.x},${this.y}`
    }
}

function coord_cmp(p1: Coord, p2: Coord): number {
    return p1.cmp(p2);
}

class CellSet {
    cells: Set<Coord>;
    sum: number;

    constructor(cells: Coord[], sum: number) {
        this.cells = new Set<Coord>(coord_cmp);
        this.sum = sum;
    }

    is_definitive(): boolean => {
        return this.sum == 0 || this.sum == this.cells.length;
    }
}

class DiffResult {
    positive: Coord[];
    sum: number;

    constructor(s1: CellSet, s2: CellSet) {
        if (s1.sum < s2.sum) {
            const s3 = s1;
            s1 = s2;
            s2 = s3;
        }
        this.positive = [];
        this.sum = s1.sum - s2.sum;

        const l1 = s1.cells.length;
        const l2 = s2.cells.length;
        let i1 = 0;
        let i2 = 0;
        while (i1 < l1 && i2 < l2) {
            const d = s1.cells[i1].cmp(s2.cells[i2])
            if (d < 0) {
                positive.push(s1.cells[i1])
                ++i1
            } else if (d > 0) {
                ++i2
            } else {
                ++i1;
                ++i2;
            }
        }
        for (; i1 < l1; ++i1) {
            positive.push(s1.cells[i1])
        }
    }

    is_definitive(): boolean {
        return this.sum == this.positive.length;
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
            if (c == CellStatus.Init) {
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
        return {x: Math.floor(view.width / 2), y: Math.floor(view.height / 2), op: Op.Dig }
    }

    const sets = []
    sets.push(init_set(view))
    view.for_each_cell((p: Coord, c: cellStatus) => {
        if (typeof c === "number") {
            const cells = []
            let sum = c
            view.for_each_adjacent(p, (pa, ca) => {
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
    return analyzer.analyze();
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
                let a = this.map[p.str()]
                if (a == null) {
                    a = []
                    this.map[p.str()] = a
                }
                a.push(s)
            }
        }
    }

    analyze(): Action[] {
        let updated = true;
        while (updated) {
            for (const s of sets) {
                if (s.sum > 8) {
                    continue
                }
                const pss = []
                for (const p of s.cells) {
                    for (const ps of this.map[p.str()]) {
                        if (ps !== s && ps.sum >= s.sum) {
                            const diff = new DiffResult(ps, s)
                            if (diff.is_definitive()) {
                                ps.sum = diff.sum
                                ps.cells = diff.positive
                            }
                        }
                    }
                }
            }
        }
        const actions = []
        for (const s of sets) {
            if (s.sum == 0) {
                for (const p of s.cells) {
                    actions.push(new Action{x:p.x, y:p.y, op: Op.Dig})
                }
            } else if (s.sum == s.cells.length) {
                for (const p of s.cells) {
                    actions.push(new Action{x:p.x, y:p.y, op: Op.Mark})
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