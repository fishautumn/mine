<script>
    import Cell from '$lib/Cell.svelte';
    import FieldOpts from '$lib/FieldOpts.svelte';
    import Clock from '$lib/Clock.svelte';

    let opt = {width: 16, height: 16, count: 40};
    let clock = {};

    const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    function count_mine(x, y) {
        let c = 0;
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < opt.width && 0 <= oy && oy < opt.height && data[oy][ox].value == -1) {
                ++c;
            }
        }
        return c;
    }

    let data;
    let status;
    let remain;
    restart();

    function flag(x, y) {
        --remain;
    }

    function unflag(x, y) {
        ++remain;
    }

    function adjacent_flags(x, y) {
        let c = 0;
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < opt.width && 0 <= oy && oy < opt.height && data[oy][ox].status == 'mark') {
                ++c;
            }
        }
        return c;
    }

    function confirm(e) {
        const stack = [[e.detail.x, e.detail.y]];
        while (stack.length > 0) {
            const pt = stack.pop();
            const x = pt[0];
            const y = pt[1];
            if (adjacent_flags(x, y) != data[y][x].value) {
                continue;
            }
            for (let o of offsets) {
                const ox = x + o[0];
                const oy = y + o[1];
                if (0 <= ox && ox < opt.width && 0 <= oy && oy < opt.height && data[oy][ox].status == 'init') {
                    if (data[oy][ox].value >= 0) {
                        data[oy][ox].status = 'clear';
                    } else {
                        data[oy][ox].status = 'fail';
                        fail();
                    }
                    if (data[oy][ox].value == 0) {
                        stack.push([ox, oy]);
                    }
                }
            }
        }
    }

    export function restart() {
        status = 'working';
        data = [];
        for (let y = 0; y < opt.height; ++y) {
            data[y] = [];
            for (let x = 0; x < opt.width; ++x) {
                data[y][x] = {
                    x: x,
                    y: y,
                    status: 'init',
                    value: null,
                    is_init: false,
                    freeze: false
                };
            }
        }
        remain = opt.count;
        if (clock.reset) {
            clock.reset();
        }
    }

    function init(e) {
        const cx = e.detail.x;
        const cy = e.detail.y;

        let mines = 0;
        while (mines < opt.count) {
            const x = Math.floor(Math.random() * opt.width);
            const y = Math.floor(Math.random() * opt.height);
            if (cx - 1 <= x && x <= cx + 1 && cy - 1 <= y && y <= cy + 1) {
                continue
            }
            if (data[y][x].value == null) {
                data[y][x].value = -1;
                mines++;
            }
        }

        for (let y = 0; y < opt.height; ++y) {
            for (let x = 0; x < opt.width; ++x) {
                data[y][x].is_init = true;
                if (data[y][x].value == null) {
                    data[y][x].value = count_mine(x, y);
                }
            }
        }

        data[cy][cx].status = 'clear';
        confirm({detail:{x:cx, y:cy}});
        init_snapshot = data;
        clock.start();
    }

    let init_snapshot;

    function fail() {
        clock.stop();
        status = 'failure';
        for (let y = 0; y < opt.height; ++y) {
            for (let x = 0; x < opt.width; ++x) {
                data[y][x].freeze = true;
            }
        }
    }

    function cell_view(c) {
        switch(c.status) {
            case 'init':
                return ' ';
            case 'mark':
                return 'F';
            case 'clear':
                return c.value;
            default:
                return 'X';
        }
    }

    function get_status() {
        if (status != 'working') {
            return status;
        }
        if (remain > 0 || has_init()) {
            return status;
        }
        clock.stop();
        status = 'success';
        return status;
    }

    function has_init() {
        for (const row of data) {
            for (const c of row) {
                if (c.status == 'init') {
                    return true;
                }
            }
        }
        return false;
    }

    export function view() {
        return {
            status: get_status(), // working, success, failure
            count: opt.count,
            remain: remain,
            width: opt.width,
            height: opt.height,
            data: data.map(row => row.map(cell_view))
        }
    }

    export function mark(x, y) {
        if (data[y][x].status == 'init') {
            --remain;
            data[y][x].status = 'mark';
        }
    }

    export function dig(x, y) {
        if (data[y][x].status == 'init') {
            if (data[y][x].value >= 0) {
                data[y][x].status = 'clear';
            } else {
                data[y][x].status = 'fail';
                fail();
            }
        }
        document.querySelector(`button#c-${x}-${y}`).click();
    }

    export function do_copy() {
        navigator.clipboard.writeText(JSON.stringify(data));
    }

    async function do_load() {
        const t = await navigator.clipboard.readText();
        data = JSON.parse(t);
        opt.count = data.reduce((acc, cur) => acc + cur.filter(x => x.value == -1).length, 0);
        remain = count - data.reduce((acc, cur) => acc + cur.filter(x => x.status == 'mark').length, 0);
        opt.width = data[0].length;
        opt.height = data.length;
    }
</script>

<FieldOpts bind:this={opt} on:change={restart} />
<p><code>Remain: {remain}</code> <Clock bind:this={clock} /></p>
<p><button on:click={restart}>restart</button></p>
<!--debug<p><button on:click={do_load}>load</button></p>-->
<div>
    {#each data as row}
        <div class="row">
            {#each row as c}
                <Cell {...c} bind:status={c.status} on:flag={flag} on:unflag={unflag} on:confirm={confirm} on:init={init} on:fail={fail} />
            {/each}
        </div>
    {/each}
</div>

<style>
div.row {
    height: 24px;
}
</style>