#!/usr/bin/env node

import inquirer from 'inquirer';
import figlet from 'figlet';
import chalk from 'chalk';
import axios from 'axios';

async function main() {
    await welcome();

    const categoryChoice = await category();

    const diffChoice = await difficulty();

    const qtyChoice = await questionAmt();

    const score = await questions(categoryChoice, diffChoice, qtyChoice);

    displayScore(score, qtyChoice);
};

async function welcome() {
    console.clear();

    figlet('Trivia CLI', (err, data) => {
        console.log(
            chalk.blue(data)
        )
    })
};

async function category() {
    const categories = await axios.get('https://the-trivia-api.com/api/categories').then(res => res.data);

    const categoryKeys = Object.keys(categories);

    const choices = [];

    choices.push({
        key: '1',
        value: 'Random'
    });

    categoryKeys.map((value, index) => {
        const obj = {};

        obj.key = index + 2;
        obj.value = value;

        choices.push(obj);
    });

    return await inquirer.prompt({
        name: 'category',
        type: 'rawlist',
        message: 'Choose a category',
        choices: choices
    })
    .then((ans) => {
        return ans.category
    });
};

async function difficulty() {
    return await inquirer.prompt({
        name: 'difficulty',
        type: 'rawlist',
        message: 'Choose a difficulty',
        choices: [
            {
                key: '1',
                value: 'Easy'
            },
            {
                key: '2',
                value: 'Medium'
            },
            {
                key: '3',
                value: 'Hard'
            }
        ]
    })
    .then((ans) => {
        return ans.difficulty.toLowerCase()
    })
};

async function questionAmt() {
    const choices = [];

    for (let i = 1; i < 21; i++) {
        const obj = {};

        obj.key = i;
        obj.value = i.toString();

        choices.push(obj);
    };

    return await inquirer.prompt({
        name: 'amount',
        type: 'rawlist',
        message: 'Enter the desired amount of questions (Between 1 and 20)',
        choices: choices
    })
    .then((ans) => {
        return ans.amount
    });
};

async function questions(category, difficulty, qty) {
    let formattedCat = category.toLowerCase().replace('&', 'and').replaceAll(' ', '_');

    let url;
    if (category == 'Random') {
        url = `https://the-trivia-api.com/api/questions?limit=${qty}&difficulty=${difficulty}`
    } else {
        url = `https://the-trivia-api.com/api/questions?categories=${formattedCat}&limit=${qty}&difficulty=${difficulty}`
    };
    
    const questionsArr = await axios.get(url).then(res => res.data);

    let score = 0;

    let currentQuestion = 1;

    const displayQuestion = async () => {
        let choiceValues = [];
        choiceValues.push(questionsArr[currentQuestion - 1]['correctAnswer']);
        questionsArr[currentQuestion - 1]['incorrectAnswers'].forEach(item => choiceValues.push(item));
    
        for (let i = choiceValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choiceValues[i], choiceValues[j]] = [choiceValues[j], choiceValues[i]];
        };

        await inquirer.prompt({
            name: 'question',
            type: 'rawlist',
            message: questionsArr[currentQuestion - 1]['question'],
            choices: [
                {
                    key: '1',
                    value: choiceValues[0]
                },
                {
                    key: '2',
                    value: choiceValues[1]
                },
                {
                    key: '3',
                    value: choiceValues[2]
                },
                {
                    key: '4',
                    value: choiceValues[3]
                }
            ]
        })
        .then(async (ans) => {
            if (ans.question === questionsArr[currentQuestion - 1]['correctAnswer']) {
                score++
            };
            
            if (currentQuestion === parseInt(qty)) return;
            currentQuestion++;
            await displayQuestion();
        })
    };

    await displayQuestion();

    return score;
};

function displayScore(score, qty) {
    let percentage = Math.floor((score / parseInt(qty)) * 100).toString() + '%';

    console.clear();

    figlet(`Score: ${percentage}`, (err, data) => {
        console.log(
            chalk.green(data)
        )
    });

    process.exit(0);
};

main();