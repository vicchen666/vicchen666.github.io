{
    $("#input-loot-luck-calculate").on("click", () => {
        let trials = $("#input-loot-luck-trials").val() * 1;
        let successes = $("#input-loot-luck-successes").val() * 1;
        let chance = $("#input-loot-luck-chance").val() / 100;

        let success = 0, percentile_rank = 0;
        let exact_chance;

        function loot_luck_calculate() {
            // single case
            // exact_chance *= (chance ** success)
            // *= ((1 - chance) ** (trials - success))

            // combinations (C(trials, successes))
            // *= (trials * ... * (trials - successes + 1)) ***main thread
            // /= (successes!)
            
            if (success <= successes) {
                exact_chance = 1;
                trial_counter = trials - success + 1;

                // exact_chance *= (chance ** success)
                counter = 0;
                while (counter != success) {
                    if (exact_chance > 100000 || trial_counter === trials + 1) {
                        exact_chance *= chance;
                        counter += 1;
                    } else {
                        exact_chance *= trial_counter;
                        trial_counter += 1;
                    }
                }

                // exact_chance *= ((1 - chance) ** (trials - success))
                counter = 0;
                while (counter != trials - success) {
                    if (exact_chance > 100000 || trial_counter === trials + 1) {
                        exact_chance *= 1 - chance;
                        counter += 1;
                    } else {
                        exact_chance *= trial_counter;
                        trial_counter += 1;
                    }
                }

                // exact_chance /= (successes!)
                counter = 1;
                while (counter != success + 1) {
                    if (exact_chance > 100000 || trial_counter === trials + 1) {
                        exact_chance /= counter;
                        counter += 1;
                    } else {
                        exact_chance *= trial_counter;
                        trial_counter += 1;
                    }
                }

                success += 1;
                percentile_rank += exact_chance;
                $("#loot-luck > section > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)").html(Math.round(success/successes * 10000) / 100 + "%");
                setTimeout(loot_luck_calculate, 0);
            } else {
                percentile_rank -= exact_chance;
                $("#loot-luck > section > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)").html("");
                $("#loot-luck > section > div > div:nth-child(2) > div:nth-child(2)").html("Percentile Rank: " + Math.round(percentile_rank * 1000000) / 10000);
                $("#loot-luck > section > div > div:nth-child(2) > div:nth-child(3)").html("Exact Chance: " + Math.round(exact_chance * 1000000) / 10000 + "%");
            }
        }
        
        if (trials >= successes && successes >= 0 && chance > 0) {
            loot_luck_calculate();
        }
    });
}