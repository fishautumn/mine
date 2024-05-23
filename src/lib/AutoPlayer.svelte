<script>
    import Field from '$lib/Field.svelte';
    import matrix_solve from '$lib/MatrixSolver.ts';
    import matrix_solve2 from '$lib/MatrixSolver.ts';

    export let field;

    const offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

    function* adjacent(v, x, y) {
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < v.width && 0 <= oy && oy < v.height) {
                yield ({x:ox, y:oy});
            }
        }
    }

    function adjacent_count(v, x, y, func) {
        let c = 0;
        for (const o of adjacent(v, x, y)) {
            if (func(v.data[o.y][o.x])) {
                ++c;
            }
        }
        return c;
    }

    function adjacent_set(v, x, y, func) {
        const r = [];
        for (const o of adjacent(v, x, y)) {
            if (func(v.data[o.y][o.x])) {
                r.push(o);
            }
        }
        return r;
    }

    function step(guess) {
        const v = field.view();
        if (v.status != 'working') {
            return false;
        }

        // debug field.do_copy();
        const r = solve(v, guess);
        if (!r || r.length == 0) {
            return false;
        }
        for (const a of r) {
            switch (a.op) {
                case 'dig':
                    field.dig(a.x, a.y);
                    break;
                case 'mark':
                    field.mark(a.x, a.y);
            }
        }
        return true;
    }

    function solve(v, guess) {
        // return random_monkey(v);
        // return careful_solver(v, guess);
        return matrix_solve2(v, guess);
    }

    function random_monkey(v) {
        const x = Math.floor(Math.random() * v.width);
        const y = Math.floor(Math.random() * v.height);
        return [{op:'dig', x: x, y: y}];
    }

    function init_set(v) {
        const cells = [];
        for (let y = 0; y < v.height; ++y) {
            for (let x = 0; x < v.width; ++x) {
                if (v.data[y][x] === ' ') {
                    cells.push({x:x, y:y});
                }
            }
        }
        return ({cells: cells, min: v.remain, max: v.remain});
    }

    function exists(set, pt) {
        return set.find(p => p.x === pt.x && p.y === pt.y) != null;
    }

    function set_eq(s1, s2) {
        return s1.length == s2.length && s1.every(a => exists(s2, a)) && s2.every(a => exists(s1, a));
    }

    function set_cmp(s1, s2) {
        const len = Math.min(s1.cells.length, s2.cells.length);
        for (let i = 0; i < len; ++i) {
            const c1 = s1.cells[i];
            const c2 = s2.cells[i];
            let d = c1.y - c2.y;
            if (d != 0) {
                return d;
            }
            d = c1.x - c2.x;
            if (d != 0) {
                return d;
            }
        }
        return s1.cells.length - s2.cells.length;
    }

    function set_same(s1, s2) {
        return s1.min == s2.min && s1.max == s2.max && s1.cells.length == s2.cells.length && set_cmp(s1, s2) == 0;
    }

    function careful_solver(v, guess) {

        const sets = [init_set(v)];

        // at the beginning: click at the field center.
        if (sets[0].cells.length == v.height * v.width) {
            return [{op:'dig', x: Math.floor(v.width/2), y: Math.floor(v.height/2)}];
        }

        for (let y = 0; y < v.height; ++y) {
            for (let x = 0; x < v.width; ++x) {
                if (typeof(v.data[y][x]) == 'number') {
                    const val = v.data[y][x];
                    const bs = adjacent_set(v, x, y, c => c === ' ');
                    if (bs.length == 0) {
                        continue;
                    }
                    const ms = adjacent_count(v, x, y, c => c === 'F');
                    const r = val - ms;
                    const s = {cells:bs, min: r, max: r};
                    sets.push(s);
                }
            }
        }

        const bs_map = {};
        for (const s of sets) {
            for (const c of s.cells) {
                const k = `${c.x},${c.y}`;
                if (k in bs_map) {
                    bs_map[k].push(s);
                } else {
                    bs_map[k] = [s];
                }
            }
        }

        for (const s1 of [...sets]) {
            const ss = [];
            for (const c of s1.cells) {
                const k = `${c.x},${c.y}`;
                for (const s2 of bs_map[k]) {
                    if (s2 !== s1 && ss.every(x => x !== s2)) {
                        ss.push(s2);
                    }
                }
            }
            for (const s2 of ss) {
                const s1_only = {cells:[]};
                const overlap = {cells:[]};
                for (const c of s1.cells) {
                    if (exists(s2.cells, c)) {
                        overlap.cells.push(c);
                    } else {
                        s1_only.cells.push(c);
                    }
                }
                // overlap has at least one cell.
                const s2_only = {cells:[]};
                for (const c of s2.cells) {
                    if (!exists(overlap.cells, c)) {
                        s2_only.cells.push(c);
                    }
                }
                if (s2_only.cells.length == 0 && s1_only.cells.length == 0) {
                    continue;
                }
                for (const s of [s1_only, s2_only, overlap]) {
                    s.min = 0;
                    s.max = s.cells.length;
                }

                let changed = true;
                while (changed) {
                    changed = false;
                    for (const [full, only] of [[s1, s1_only], [s2, s2_only]]) {
                        if (full.max - only.min < overlap.max) {
                            overlap.max = full.max - only.min;
                            changed = true;
                        }
                        if (full.min - only.max > overlap.min) {
                            overlap.min = full.min - only.max;
                            changed = true;
                        }
                        if (full.max - overlap.min < only.max) {
                            only.max = full.max - overlap.min;
                            changed = true;
                        }
                        if (full.min - overlap.max > only.min) {
                            only.min = full.min - overlap.max;
                            changed = true;
                        }
                    }
                }
                for (const ns of [overlap, s1_only, s2_only].filter(s => s.cells.length > 0 && s.min == s.max)) {
                    if (sets.filter(s => set_same(s, ns)).length > 0) {
                        continue;
                    }
                    sets.push(ns);
                    if (ns.cells.length <= 8) {
                        for (const c of ns.cells) {
                            const k = `${c.x},${c.y}`;
                            if (k in bs_map) {
                                bs_map[k].push(ns);
                            } else {
                                bs_map[k] = [ns];
                            }
                        }
                    }
                }
            }
        }

        let ret = [];
        for (const s of sets.filter(s => s.cells.length == s.min)) {
            for (const c of s.cells) {
                ret.push({op:'mark', x:c.x, y:c.y});
            }
        }
        for (const s of sets.filter(s => s.max == 0)) {
            for (const c of s.cells) {
                ret.push({op:'dig', x:c.x, y:c.y});
            }
        }
        if (ret.length > 0) {
            return ret;
        }
        if (!guess) {
            return [];
        }

        // click minimum probability init cell
        const pt = find_min_probability(sets);
        pt['op'] = 'dig';
        return [pt];
    }

    function find_min_probability(sets) {
        const m = [];
        for (const s of sets) {
            const tp = (s.min + s.max) / s.cells.length;
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
        let min_p = 4;
        let pt;
        for (const [y, row] of m.entries()) {
            if (row == null) {
                continue;
            }
            for (const [x, p] of row.entries()) {
                if (p != null && p < min_p) {
                    min_p = p;
                    pt = {x:x, y:y};
                }
            }
        }
        return pt;
    }

    async function go(guess) {
        setTimeout(() => { if (step(guess)) { go(guess) } }, 20);
    }

</script>

<div>
    <p/>
    <button on:click={() => go(false)}><code>Go</code></button>
    <button on:click={() => step(false)}><code>Step</code></button>
    <br/><br/>
    <button on:click={() => go(true)}><code>Go Guess</code></button>
    <button on:click={() => step(true)}><code>Step Guess</code></button>

</div>