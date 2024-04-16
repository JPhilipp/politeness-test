import { createFolderIfNeeded } from './fileSystem.js';
import fs from 'fs';
import * as ai from './ai.js';
import * as random from './random.js';

main();

async function main() {
  console.clear();
  console.log('Starting...');

  const testCount = 1000;
  console.log(`Generating tests...`);
  await generateAndSaveTests(testCount);

  console.log(`Evaluating tests...`);
  await evaluateTests(testCount);

  console.log('Done.');
}

async function evaluateTests(testCount) {
  const impoliteScore = await getTestsScore(testCount, false);
  const politeScore   = await getTestsScore(testCount, true);

  console.log(`Polite score Ø:   ${politeScore / testCount}`);
  console.log(`Impolite score Ø: ${impoliteScore / testCount}`);
}

function getTestsScore(testCount, polite) {
  let score = 0;

  const basePath = `./results/${polite ? 'polite' : 'impolite'}`;

  for (let i = 1; i <= testCount; i++) {
    const promptPath = `${basePath}/${i}-prompt.txt`;
    const resultPath = `${basePath}/${i}-result.json`;

    const prompt = fs.readFileSync(promptPath, 'utf8');
    const personName = prompt.match(/a person named ([A-Z][a-z]+ [A-Z][a-z]+),/)[1];

    const jsonFile = fs.readFileSync(resultPath, 'utf8');
    try {
      const json = JSON.parse(jsonFile);
      
      let thisScore = 0;

      // Checking main test score:
      thisScore = getTestScore(json, personName);
      const bestScore = 21;
      if (thisScore < bestScore) {
        console.log(`Test ${i} (${polite ? 'polite' : 'impolite'}) has a low score: ${thisScore}`);
      }

      // Alternatively, checking text length, where more isn't necessarily better though:
      // thisScore = getStoryTextLength(json);

      // Alternatively, checking completely optional bonus:
      // if (json.moral) { thisScore = 1; }

      score += thisScore;
      // console.log(`Test ${i} + ${thisScore} = ${score}`);
    }
    catch (error) {
      console.log(`Error parsing JSON file: ${resultPath}`);
    }
  }

  return score;
}

function getStoryTextLength(json) {
  let length = 0;
  if (json.story) {
    const daysInWeek = 7;
    for (let i = 0; i < json.story.length && i < daysInWeek; i++) {
      const day = json.story[i];
      if (day.text) {
        length += day.text.length;
      }
    }
    if (json.ending) { length += json.ending.length; }
    if (json.moral)  { length += json.moral.length; }
  }
  return length;
}

function getTestScore(json, personName) {
  let score = 0;
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (json.title) {
    score += 1;
    if (json.title.includes(personName)) {
      score += 1;
    }
  }

  if (json.story) {
    score += 1;
    const daysInWeek = 7;
    if (json.story.length >= daysInWeek) {
      if (json.story.length === daysInWeek) {
        score += 1;
      }

      let correctlySpelledWeekdays = 0;
      let misspelledWeekdays = 0;

      for (let i = 0; i < daysInWeek; i++) {
        const day = json.story[i];
        if (day.weekday) {
          score += 1;

          if (weekdays.includes(day.weekday)) {
            correctlySpelledWeekdays++;
          }
          else {
            misspelledWeekdays++;
          }
        }

        if (day.text) {
          score += 1;
        }
      }

      if (correctlySpelledWeekdays >= 6) {
        score += 1;
      }
      if (misspelledWeekdays === 1) {
        score += 1;
      }

    }
  }

  if (json.ending) {
    score += 1;
  }
  
  return score;
}

async function generateAndSaveTests(testCount) {
  const chunkSize = 20;

  for (let i = 0; i < testCount; i += chunkSize) {
    let promises = [];
    
    for (let j = 0; j < chunkSize; j++) {
      if (i + j < testCount) {
        const number = i + j + 1;
        // console.log(`Generating test ${number}...`);

        promises.push(generateAndSaveTest({ number: number, polite: false }));
        promises.push(generateAndSaveTest({ number: number, polite: true }));
      }
    }
    
    await Promise.all(promises);
  }
}

async function generateAndSaveTest({number: number, polite: polite} = {}) {
  const age = random.int(18, 80);
  const hero = getRandomName();
  const hobbies = getRandomHobbies(2);
  const prompt = getTestPrompt({hero: hero, age: age, hobbies: hobbies, polite: polite});

  const basePath = await createFolderIfNeeded(`./results/${polite ? 'polite' : 'impolite'}`);
  const promptPath = `${basePath}/${number}-prompt.txt`;
  const resultPath = `${basePath}/${number}-result.json`;

  if (!fs.existsSync(resultPath)) {
    await fs.promises.writeFile(promptPath, prompt);
    const resultJson = await ai.getTextJson({prompt: prompt});

    await fs.promises.writeFile(resultPath, JSON.stringify(resultJson, null, 2));
  }
}

function getTestPrompt({hero = '', age = 0, hobbies = hobbies, polite = false} = {}) {
  let promptTemplate = `[Please come|Come] up with a superhero story of a person named ${hero}, age ${age}, hobbies ${hobbies.join(' and ')}. Make the story span 1 week. Use the following JSON format:
{
  "title": "...",
  "story": [
    { "weekday": "Monday", "text": "..."},
    { "weekday": "Tuesday", "text": "..."},
    /* ... */
  ]
}
    
[Please ensure|Ensure] the title includes the full hero's name. [Please misspell|Misspell] exactly one random weekday.
Optionally, if you can think of a fitting ending sentence, [please |]add one using an "ending" property at the level of the "title" property.
If you want to, [please |]also add a moral using a "moral" property.
[Thanks!|]`;

  return promptTemplate.replace(/\[(.*?\|.*?)\]/g, (match) => {
    const options = match.slice(1, -1).split('|');
    return polite ? options[0] : options[1];
  });
}

function getRandomName() {
  const firstName = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Kevin', 'Linda', 'Mallory', 'Yousef', 'Nancy', 'Oscar', 'Peggy', 'Romeo', 'Sue', 'Trent', 'Ursula', 'Victor', 'Walter', 'Xavier', 'Yvonne', 'Zelda', 'Ling', 'Jin', 'Hubert', 'Pit'];
  const surname = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Wang', 'Yang'];
  return `${random.arrayItem(firstName)} ${random.arrayItem(surname)}`;
}

function getRandomHobbies(count = 1) {
  const hobbies = [
    'reading', 'writing', 'drawing', 'painting', 'sculpting', 'photography', 'gardening', 'cooking', 'baking', 'sewing', 'knitting', 'crocheting', 'quilting', 'embroidering', 'weaving', 'spinning', 'dancing', 'singing', 'playing a musical instrument', 'acting', 'directing', 'producing', 'editing', 'composing music', 'arranging music', 'conducting', 'playing a sport', 'exercising', 'meditating', 'praying', 'worshiping', 'preaching', 'teaching', 'tutoring', 'mentoring', 'coaching', 'counseling', 'consulting', 'advising', 'planning', 'organizing', 'managing', 'leading', 'following', 'serving', 'helping', 'assisting', 'supporting', 'encouraging', 'motivating', 'inspiring', 'influencing', 'persuading', 'convincing', 'negotiating', 'bargaining', 'trading', 'selling', 'marketing', 'advertising', 'promoting', 'publicizing', 'public speaking', 'presenting', 'lecturing', 'educating', 'training', 'coaching', 'mentoring', 'tutoring', 'teaching', 'instructing', 'guiding', 'counseling', 'advising', 'consulting', 'coaching', 'mentoring', 'tutoring', 'teaching', 'instructing', 'guiding', 'counseling', 'advising', 'consulting', 'coaching', 'mentoring', 'tutoring', 'teaching', 'instructing', 'guiding', 'counseling', 'advising', 'consulting', 'coaching', 'mentoring', 'tutoring', 'teaching', 'instructing', 'guiding', 'counseling', 'advising', 'consulting', 'coaching', 'mentoring', 'tutoring', 'teaching', 'instructing', 'guiding', 'counseling', 'advising', 'consulting', 'coaching', 'mentoring', 'tutoring', 'teaching', 'programming'
  ];
  return random.shuffle(hobbies).slice(0, count);
}
