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

    function step() {
        const v = field.view();
        if (v.status != 'working') {
            return false;
        }

        const r = solve(v);
        if (!r) {
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

    function solve(v) {
        // return random_monkey(v);
        return careful_solver(v);
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
        const p = v.remain / cells.length;
        return ({cells: cells, min: p, max: p});
    }

    function careful_solver(v) {
        // mark definite mine, dig definite blanks

        const sets = [init_set(v)];
        if (sets[0].min == sets[0].cells.length) {
            return sets.map(c => ({op:'mark', x:c.x, y:c.y}));
        }
        if (sets[0].max == 0) {
            return sets.map(c => ({op:'dig', x:c.x, y:c.y}));
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
                    sets.push({cells:bs, min: r, max: r});
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
        setTimeout(() => { if (step()) { go() } }, 100);
    }

</script>

<button on:click={step}>One Step</button>

<button on:click={go}>Go</button>

