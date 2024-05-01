<script>
    import Cell from '$lib/Cell.svelte';

    const width = 30;
    const height = 16;
    const count = 99;

    const cells = [];
    for (let y = 0; y < height; ++y) {
        cells[y] = [];
        for (let x = 0; x < width; ++x) {
            cells[y][x] = false;
        }
    }
    let mines = 0;
    while (mines < count) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (!cells[y][x]) {
            cells[y][x] = true;
            mines++;
        }
    }

    const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    function count_mine(x, y) {
        let c = 0;
        for (let o of offsets) {
            const ox = x + o[0];
            const oy = y + o[1];
            if (0 <= ox && ox < width && 0 <= oy && oy < height && cells[oy][ox]) {
                ++c;
            }
        }
        return c;
    }

    const data = [];
    for (let y = 0; y < height; ++y) {
        data[y] = [];
        for (let x = 0; x < width; ++x) {
            const value = cells[y][x] ? -1 : count_mine(x, y);
            data[y][x] = {
                x: x,
                y: y,
                value: value,
                status: 'init'
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
                    console.log(data[oy][ox]);
                    document.querySelector(`img#c-${ox}-${oy}`).click()
                }
            }
        }
    }
</script>

Remain <span>{remain}</span>
<div>
    {#each data as row}
        <div>
            {#each row as c}
                <Cell value={c.value} x={c.x} y={c.y} on:flag={flag} bind:this={c.cell} bind:status={c.status} on:unflag={unflag} on:confirm={confirm} />
            {/each}
        </div>
    {/each}
</div>

<style>
table {
    table-layout: fixed;
    border: 1px solid black;
}
tr {
    height: 20px;
}
</style>