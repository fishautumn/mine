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
                status: 'uninit',
                value: null
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
        const x = e.detail.x;
        const y = e.detail.y;
        if (adjacent_flags(x, y) != data[y][x].value) {
            return;
        }
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < width && 0 <= oy && oy < height) {
                if (data[oy][ox].status == 'init') {
                    document.querySelector(`img#c-${ox}-${oy}`).click()
                }
            }
        }
    }

    function restart() {
        remain = count;
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                data[y][x].status = 'uninit';
                data[y][x].value = null;
                data[y][x].is_init = true;
            }
        }
    }

    function init(e) {
        const cx = e.detail.x;
        const cy = e.detail.y;

        if (data[cy][cx].status != 'uninit') {
            return;
        }


        let mines = 0;
        while (mines < count) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            if ((x < cx -1 || x > cx + 1) && (y < cy - 1 || y > cy + 1) && data[y][x].value == null) {
                data[y][x].value = -1;
                mines++;
            }
        }

        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                data[y][x].status = 'init';
                if (data[y][x].value == null) {
                    data[y][x].value = count_mine(x, y);
                }
            }
        }

        document.querySelector(`img#c-${cx}-${cy}`).click()
    }
</script>
<button on:click={restart}>restart</button><br>
Remain <span>{remain}</span><br>
<div>
    {#each data as row}
        <div>
            {#each row as c}
                <Cell {...c} bind:status={c.status} on:flag={flag} on:unflag={unflag} on:confirm={confirm} on:init={init} />
            {/each}
        </div>
    {/each}
</div>
