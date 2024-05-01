<script>

    export let value;
    export let x;
    export let y;
    export let status = 'uninit';

    // value: 0~8, -1
    // state: init, clear, mark, fail, wrong

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const status_img = {
        uninit: 'init',
        init: 'init',
        clear: value,
        mark: 'flag',
        fail: 'mine-red',
        wrong: 'flag-red',
    };

    $: src = (status_img[status] ?? value ?? 'init') + '.svg';

    export let is_init = true;

    function onclick(e) {
        if (status == 'uninit' && is_init) {
            is_init = false;
            dispatch('init', {x, y});
        } else if (status == 'uninit' || status == 'init') {
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

    function contextmenu() {
        onclick({button:2})
    }
</script>

<img {src} on:click={onclick} on:contextmenu|preventDefault={() => onclick({button:2})} id={`c-${x}-${y}`} />

<style>
img {
    width: 24px;
    height: 24px;
}
</style>