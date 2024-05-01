<script>
    import Field from '$lib/Field.svelte';

    export let field;

    function step() {
        const v = field.view();
        if (v.status != 'working') {
            return false;
        }

        const r = solve(v);
        if (!r) {
            return false;
        }
        for (const a of r) {
            switch (a.op) {
                case 'dig':
                    field.dig(a.x, a.y);
                    break;
                case 'mark':
                    field.mark(a.x, a.y);
            }
        }
        return true;
    }

    function solve(v) {
        return random_monkey(v);
    }

    function random_monkey(v) {
        const x = Math.floor(Math.random() * v.width);
        const y = Math.floor(Math.random() * v.height);
        return [{op:'dig', x: x, y: y}];
    }

    function careful_solver(v) {
        // mark definite mine, dig definite blanks
    }

    async function go() {
        setTimeout(() => { if (step()) { go() } }, 100);
    }

</script>

<button on:click={step}>One Step</button>

<button on:click={go}>Go</button>

