<script>
    const levels = {
        easy: {
            width: 8,
            height: 8,
            count: 10
        },
        medium: {
            width: 16,
            height: 16,
            count: 40
        },
        export: {
            width: 30,
            height: 16,
            count: 99
        }
    };

    let level = "medium";
    export let width = 16;
    export let height = 16;
    export let count = 40;

    function on_level_changed() {
        if (level in levels) {
            const opt = levels[level];
            width = opt.width;
            height = opt.height;
            count = opt.count;
        }
    }
</script>

<div>
    <div>
        {#each Object.keys(levels) as opt}
            <label><input type="radio" name="level" value={opt} bind:group={level} on:change={on_level_changed} />{opt}</label><br/>
        {/each}
        <label><input type="radio" name="level" value="customize" bind:group={level} on:change={on_level_changed}/>customize</label>
    </div>
    <div>
        {#if level in levels}
            <label>width: <input type="number" name="width" bind:value={width} readonly/></label><br/>
            <label>height: <input type="number" name="height" bind:value={height} readonly/></label><br/>
            <label>count: <input type="number" name="count" bind:value={count} readonly/></label>
        {:else}
            <label>width: <input type="number" name="width" bind:value={width}/></label><br/>
            <label>height: <input type="number" name="height" bind:value={height}/></label><br/>
            <label>count: <input type="number" name="count" bind:value={count}/></label>
        {/if}
    </div>
</div>