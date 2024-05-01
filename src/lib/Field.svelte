<script>
    import Cell from '$lib/Cell.svelte';

    const width = 16;
    const height = 30;
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
            data[y][x] = {
                'x': x,
                'y': y,
                'value': (cells[y][x] ? -1 : count_mine(x, y)),
                'status': 'init'
            };
        }
    }
</script>

<table border="1px">
    {#each data as row}
        <tr>
            {#each row as c}
                <Cell x={c.x} y={c.y} value={c.value} status={c.status} />
            {/each}
        </tr>
    {/each}
</table>

<style>
table {
    table-layout: fixed;
    border: 1px solid black;
}
tr {
    height: 20px;
}
</style>