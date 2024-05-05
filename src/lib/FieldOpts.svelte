<svelte:options accessors />

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

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    function choose_level() {
        document.querySelector('dialog#opt_dlg').showModal();
    }

    function close_dlg() {
        document.querySelector('dialog#opt_dlg').close();
        dispatch("change");
    }

</script>

<div>
    <label><code>Level <button on:click={choose_level}><code>{level}</code></button>: {width}x{height},{count}</code></label>
    <dialog id="opt_dlg">
        <div>
            {#each Object.keys(levels) as opt}
                <label><input type="radio" name="level" value={opt} bind:group={level} on:change={on_level_changed} />{opt}</label><br/>
            {/each}
            <label><input type="radio" name="level" value="customize" bind:group={level} on:change={on_level_changed}/>customize</label><br>&nbsp;
        </div>
        <div>
            {#if level in levels}
                <label for="width">width: </label><input type="number" name="width" bind:value={width} disabled/><br/>
                <label for="height">height: </label><input type="number" name="height" bind:value={height} disabled/><br/>
                <label for="count">count: </label><input type="number" name="count" bind:value={count} disabled/>
            {:else}
                <label for="width">width: </label><input type="number" name="width" bind:value={width}/><br/>
                <label for="height">height: </label><input type="number" name="height" bind:value={height}/><br/>
                <label for="count">count: </label><input type="number" name="count" bind:value={count}/>
            {/if}
            <br/>&nbsp;
        </div>
        <button on:click={close_dlg}><code>OK</code></button>
    </dialog>
</div>

<style>
input[type='number'] {
    width: 40px;
}
label[for] {
    display: inline-block;
    width: 50px;
    text-align: right;
}
</style>