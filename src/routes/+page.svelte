<script>
    import Cell from '$lib/Cell.svelte';
    import Field from '$lib/Field.svelte';
    import AutoPlayer from '$lib/AutoPlayer.svelte';

    let field;
</script>

<Field bind:this={field} />
<AutoPlayer {field} />
