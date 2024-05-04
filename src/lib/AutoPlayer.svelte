<script>
    import Field from '$lib/Field.svelte';

    export let field;

    const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    function* adjacent(v, x, y) {
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < v.width && 0 <= oy && oy < v.height) {
                yield ({x:ox, y:oy});
            }
        }
    }

    function* adjacent2(v, x, y) {
        for (const dy of [-2, -1]) {
            const oy = y + dy;
            if (oy < 0) {
                continue;
            }
            for (const dx of [-2, -1, 0, 1, 2]) {
                const ox = x + dx;
                if (0 <= ox && ox < v.width) {
                    yield ({x:ox, y:oy});
                }
            }
        }
        for (const dy of [0]) {
            const oy = y + dy;
            for (const dx of [-2, -1]) {
                const ox = x + dx;
                if (ox >= 0) {
                    yield ({x:ox, y:oy});
                }
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
        return careful_solver(v, guess);
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

    function remove_dup(set) {
        for (let i = set.length - 2; i >= 0; --i) {
            for (let j = set.length - 1; j > i; --j) {
                if (set_eq(set[i].cells, set[j].cells)) {
                    set[i].min = Math.max(set[i].min, set[j].min);
                    set[i].max = Math.min(set[i].max, set[j].max);
                    set[j] = set[set.length - 1];
                    set.length--;
                }
            }
        }
    }

    function careful_solver(v, guess) {
        // mark definite mine, dig definite blanks

        const sets = [init_set(v)];

        const bs_map = {};
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
                    const k = `${x},${y}`;
                    bs_map[`${x},${y}`] = [s];
                }
            }
        }

        let def = sets.filter(s => s.cells.length == s.min);
        const ret = [];
        for (const s of def) {
            for (const c of s.cells) {
                ret.push({op:'mark', x:c.x, y:c.y});
            }
        }

        def = sets.filter(s => s.max == 0);
        for (const s of def) {
            for (const c of s.cells) {
                ret.push({op:'dig', x:c.x, y:c.y});
            }
        }

        if (ret.length > 0) {
            return ret;
        }

        for (let y = 0; y < v.height; ++y) {
            for (let x = 0; x < v.width; ++x) {
                const tcbs = bs_map[`${x},${y}`];
                if (tcbs == null) {
                    continue;
                }
                const cbs = tcbs[0];
                for (const o of adjacent2(v, x, y)) {
                    const tabs = bs_map[`${o.x},${o.y}`];
                    if (tabs == null) {
                        continue;
                    }
                    for (const abs of [...tabs, sets[0]]) {
                        const c_only = {cells:[]};
                        const a_only = {cells:[]};
                        const overlap = {cells:[]};
                        for (const cc of cbs.cells) {
                            if (exists(abs.cells, cc)) {
                                overlap.cells.push(cc);
                            } else {
                                c_only.cells.push(cc);
                            }
                        }
                        if (overlap.cells.length === 0) {
                            continue;
                        }
                        for (const ac of abs.cells) {
                            if (!exists(overlap.cells, ac)) {
                                a_only.cells.push(ac);
                            }
                        }
                        if (a_only.cells.length == 0 && c_only.cells.length == 0) {
                            continue;
                        }
                        for (const s of [c_only, a_only, overlap]) {
                            s.min = 0;
                            s.max = s.cells.length;
                        }

                        let done = false;
                        while (!done) {
                            let changed = false;

                            for (const m of [cbs.max - c_only.min, abs.max - a_only.min]) {
                                if (m < overlap.max) {
                                    overlap.max = m;
                                    changed = true;
                                }
                            }
                            for (const m of [cbs.min - c_only.max, abs.min - a_only.max]) {
                                if (m > overlap.min) {
                                    overlap.min = m;
                                    changed = true;
                                }
                            }
                            if (cbs.max - overlap.min < c_only.max) {
                                c_only.max = cbs.max - overlap.min;
                                changed = true;
                            }
                            if (cbs.min - overlap.max > c_only.min) {
                                c_only.min = cbs.min - overlap.max;
                                changed = true;
                            }
                            if (abs.max - overlap.min < a_only.max) {
                                a_only.max = abs.max - overlap.min;
                                changed = true;
                            }
                            if (abs.min - overlap.max > a_only.min) {
                                a_only.min = abs.min - overlap.max;
                                changed = true;
                            }

                            done = !changed;
                        }
                        [overlap, c_only, a_only].filter(s => s.cells.length > 0).forEach(s => sets.push(s));
                        [overlap, c_only].filter(s => s.cells.length > 0).forEach(s => tcbs.push(s));
                        remove_dup(tcbs);
                        if (abs !== sets[0]) {
                            [overlap, a_only].filter(s => s.cells.length > 0).forEach(s => tabs.push(s));
                            remove_dup(tabs);
                        }
                    }
                }
            }
        }

        def = sets.filter(s => s.cells.length == s.min);
        for (const s of def) {
            for (const c of s.cells) {
                ret.push({op:'mark', x:c.x, y:c.y});
            }
        }

        def = sets.filter(s => s.max == 0);
        for (const s of def) {
            for (const c of s.cells) {
                ret.push({op:'dig', x:c.x, y:c.y});
            }
        }

        if (ret.length > 0) {
            return ret;
        }

        if (sets[0].cells.length == v.height * v.width) {
            return [{op:'dig', x: Math.floor(v.width/2), y: Math.floor(v.height/2)}];
        }

        if (!guess) {
            return [];
        }

        // click minimum probability init cell
        let t = null;
        let mp = 4;
        for (let s of sets) {
            if (s.min + s.max < mp) {
                mp = s.min + s.max;
                t = s;
            }
        }
        return [{op:'dig', x:t.cells[0].x, y:t.cells[0].y}];
    }

    async function go() {
        setTimeout(() => { if (step()) { go() } }, 20);
    }

</script>

<div>
    <p/>
    <button on:click={go}>Go</button>

    <button on:click={step}>One Step</button>

    <button on:click={() => step(true)}>Guess</button>
</div>