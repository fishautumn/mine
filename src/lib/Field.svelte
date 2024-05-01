<script>
    import Cell from '$lib/Cell.svelte';

    const width = 30;
    const height = 16;
    const count = 99;

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

    const data = [];
    for (let y = 0; y < height; ++y) {
        data[y] = [];
        for (let x = 0; x < width; ++x) {
            data[y][x] = {
                x: x,
                y: y,
                status: 'init',
                value: null,
                is_init: false
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
                    data[oy][ox].status = 'clear';
                    if (data[oy][ox].value == 0) {
                        stack.push([ox, oy]);
                    }
                }
            }
        }
    }

    function restart() {
        remain = count;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const c = data[y][x];
                c.status = 'init';
                c.value = null;
                c.is_init = false;
            }
        }
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

    function* range(len) {
        for (let i = 0; i < len; ++i) {
            yield i;
        }
    }
</script>
<button on:click={restart}>restart</button><br>
Remain <span>{remain}</span><br>
<div>
    {#each range(height) as y}
        <div>
            {#each range(width) as x}
                <Cell {...data[y][x]} bind:status={data[y][x].status} on:flag={flag} on:unflag={unflag} on:confirm={confirm} on:init={init} />
            {/each}
        </div>
    {/each}
</div>
