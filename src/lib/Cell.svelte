<script>

    export let value;
    export let x;
    export let y;
    export let status;
    export let is_init;

    // value: 0~8, -1
    // state: init, clear, mark, fail, wrong

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const status_img = {
        init: 'init',
        clear: value,
        mark: 'flag',
        fail: 'mine-red',
        wrong: 'flag-red',
    };

    $: src = (status_img[status] ?? value ?? 'init') + '.svg';

    function onclick(e) {
        if (!is_init) {
            is_init = true;
            dispatch('init', {x, y});
        } else if (status == 'init') {
            if (e.button == 0) {
                if (value == -1) {
                    status = 'fail';
                    dispatch('fail', { x, y });
                } else {
                    status = 'clear';
                    if (value == 0) {
                        dispatch('confirm', { x, y });
                    }
                }
            } else if (e.button == 2) {
                dispatch('flag', { x, y });
                status = 'mark';
            }
        } else if (status == 'clear' && value > 0) {
            dispatch('confirm', { x, y });
        } else if (status == 'mark' && e.button == 2) {
            dispatch('unflag', { x, y });
            status = 'init';
        }
    }

</script>

<img {src} on:click={onclick} on:contextmenu|preventDefault={() => onclick({button:2})} id={`c-${x}-${y}`} />

<style>
img {
    width: 24px;
    height: 24px;
}
</style>