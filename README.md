This Nodejs project compares using "Please" and "Thanks" with the ChatGPT API. The prompt isn't representative of all kinds of prompts, but just looks into a straightforward one which gets back JSON. Examples can be found in the results folder.

- [An example non-polite/ neutral prompt can be found here.](https://github.com/JPhilipp/politeness-test/blob/main/results/impolite/1-prompt.txt)
- [An example polite prompt can be found here.](https://github.com/JPhilipp/politeness-test/blob/main/results/polite/1-prompt.txt)
- [An example result JSON can be found here.](https://github.com/JPhilipp/politeness-test/blob/main/results/polite/1-result.json)

(Note the bonus task of adding a "moral" to the story was not taken into the score calculation.)

Based on this test with 1000 tries of a non-polite/ normal variant and a polite one each, there seems to be no significant score difference:

    Polite score Ø:   20.965
    Impolite score Ø: 20.948

If we count story text length, it's a bit higher for the polite version, which isn't necessarily provable good or bad (and may simply follow the vibe of Please and Thanks generally resulting in a longer prompt).

PS: This test notwithstanding, I will personally keep using Please and Thanks. For one thing, it may yield improvements in hard-to-test creative areas, or complex tasks (neither of which this test measures). On top, it's simply more polite to our LLM friend!
