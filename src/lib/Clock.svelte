<script>
    let begin = 0;
    let add = 0;
    let end = 0;
    let timer;
    let elapse = 0;

    export function reset() {
        begin = 0;
        end = 0;
        add = 0;
        elapse = 0;
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    export function start() {
        reset();
        begin = Date.now();
        timer = setInterval(()=> elapse = calc(), 100);
    }

    export function stop() {
        end = Date.now();
        elapse = calc();
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function calc() {
        if (begin == 0) {
            return 0;
        }
        if (end != 0) {
            return end + add - begin;
        }
        return Date.now() + add - begin;
    }

</script>

<code>Elapsed: {(elapse / 1000).toFixed(3)} seconds</code>