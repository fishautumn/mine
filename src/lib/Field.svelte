<script>
    import Cell from '$lib/Cell.svelte';

    // adv
    // const width = 30;
    // const height = 16;
    // const count = 99;

    // easy
    const width = 8;
    const height = 8;
    const count = 10;

    // medium
    // const width = 16;
    // const height = 16;
    // const count = 40;

    const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    function count_mine(x, y) {
        let c = 0;
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < width && 0 <= oy && oy < height && data[oy][ox].value == -1) {
                ++c;
            }
        }
        return c;
    }

    let data = [];
    for (let y = 0; y < height; ++y) {
        data[y] = [];
        for (let x = 0; x < width; ++x) {
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

    let remain = count;

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
            if (0 <= ox && ox < width && 0 <= oy && oy < height && data[oy][ox].status == 'mark') {
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
                if (0 <= ox && ox < width && 0 <= oy && oy < height && data[oy][ox].status == 'init') {
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
        remain = count;
        status = 'working';
        for (const row of data) {
            for (const c of row) {
                c.status = 'init';
                c.value = null;
                c.is_init = false;
                c.freeze = false;
            }
        }
        data = data
    }

    function init(e) {
        const cx = e.detail.x;
        const cy = e.detail.y;

        let mines = 0;
        while (mines < count) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            if (cx - 1 <= x && x <= cx + 1 && cy - 1 <= y && y <= cy + 1) {
                continue
            }
            if (data[y][x].value == null) {
                data[y][x].value = -1;
                mines++;
            }
        }

        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                data[y][x].is_init = true;
                if (data[y][x].value == null) {
                    data[y][x].value = count_mine(x, y);
                }
            }
        }

        data[cy][cx].status = 'clear';
        confirm({detail:{x:cx, y:cy}});
    }

    function fail() {
        status = 'failure';
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
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

    let status = 'working';

    function get_status() {
        if (status != 'working') {
            return status;
        }
        if (remain > 0 || has_init()) {
            return status;
        }
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
            remain: remain,
            width: width,
            height: height,
            data: data.map(row => row.map(cell_view))
        }
    }

    export function mark(x, y) {
        if (data[y][x].status == 'init') {
            data[y][x].status = 'mark';
        }
    }

    export function dig(x, y) {
        document.querySelector(`img#c-${x}-${y}`).click();
    }
</script>

<p><code>Remain: {remain}</code></p>
<p><button on:click={restart}>restart</button></p>
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