

Current Groq Pricing (as of 2024)
Llama-3.1-8B-Instruct: $0.05 per 1M input tokens, $0.10 per 1M output tokens
Llama-3.1-70B-Instruct: $0.59 per 1M input tokens, $0.79 per 1M output tokens
Mixtral-8x7B-Instruct: $0.14 per 1M input tokens, $0.42 per 1M output tokens


Exercise Library Categories : [Strength, Stretching, Balance, Mobility, Plyometrics, Cardio, rehabilitation]
These are the quantities of exercises by category
    balance	5
    cardio	34
    mobility	31
    plyometrics	17
    rehabilitation	4
    strength	1180
    stretching	53

####
#### Input Prompt 1 
#### Broad overall suggestion
[user data on muscle scores indicating which muscles are under and over trained] 
[user category volume, e.g.:] 
    ive done XXX strength training volume in past 3 days. i’ve done YYY cardio, ZZZ yoga/core/stability work [can you suggest an intuitive name for this category of like yoga type, plank type, good stability type workouts]
[recent user food history, e.g.:]
    My total calories are 2500 per day with 40/50/30 protein/carb/fat ratio percent. it’s 11 am and i’ve had 700 cal today, 90g carb, 25g fat, 35g protein. 
[Requested output]
    Please suggest category, volume, and a meal plan for the rest of the day. And a meal plan for the following day 
#### Output:
Recommend exercise today in the evening around 5 pm: Stability category today, plank and dead bug, plan for a cardio or HIIT tomorrow. 
Meal plan today: ABCXYZ at times A B C D
meal plan tomorrow: (fill in meal plan)
{end output}

#### Input Prompt 2
#### Bite-size suggestion exercise
[user workout data prev 3 days]
Please suggest category and reasoning
#### Output:
You have recorded long (30+ min) runs 3 days in a row. You should do stretching and strength training, focuing on [xyz muscles] because of the runs for [these reasons]

#### Input Prompt 3
#### Bite-size suggestion food
[user food data for prev 24 hours]
Please suggest foods with specific time and explanation
#### Output:
You have recorded a high carb high fat breakfast with little fiber. At 11 AM, you should have a protein shake and berries to add fiber and protein then  [ABC food plan with times] because of [these reasons]