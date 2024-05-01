<script>

    export let value;
    export let x;
    export let y;
    export let status = 'init';

    // value: 0~8, -1
    // state: init, clear, mark, fail, wrong

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const status_text = {
        init: ' ',
        clear: value == 0 ? ' ' : value,
        mark: 'F',
        fail: 'X',
        wrong: 'X',
    }

    function onclick(e) {
        if (status == 'init') {
            if (e.button == 0) {
                if (value == 0) {
                    dispatch('clear', { x, y });
                } else if (value == -1) {
                    status = 'fail';
                } else {
                    status = 'clear';
                }
            } else if (e.button == 2) {
                status = 'mark';
            }
        } else if (status == 'clear' && value > 0) {
            dispatch('confirm', { x, y });
        } else if (status == 'mark' && e.button == 2) {
            status = 'init';
        }
    }

    function contextmenu() {
        onclick({button:2})
    }
</script>

<td on:click={onclick} on:contextmenu|preventDefault={contextmenu}><code>{status_text[status]}</code></td>

<style>
td {
    text-align: center;
    border-collapse: collapse;
    width: 20px;
}
</style>