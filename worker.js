import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';

self.postMessage({status: 'loading generative model'});
const generator = await pipeline(
    'text-generation',
    'onnx-community/Qwen2.5-0.5B-Instruct',
    { device: 'webgpu', dtype: 'q4' } 
  );
self.postMessage({status: 'ready'});

self.onmessage = async (e) => {
    const data = e.data; 

    if(data.action === 'generateText'){
        self.postMessage({status: 'generating text'});
        const messages = [
            { 
                role: 'system', 
                content: 'You need to create an informational reading comprehension passage for students based on the given topic. Respond with only the passage. No citations or sources required.' 
            },
            { 
                role: 'user', 
                content: `Topic: ${data.topic}.` 
            }
        ];

        const output = await generator(messages, {
            max_new_tokens: 400,
            temperature: 0.7, 
            do_sample: true,
        });
        const text = output[0].generated_text.at(-1).content;
        self.postMessage({status: 'text generated', output: text});

        self.postMessage({status: 'generating question'});
        const messages2 = [
            { 
                role: 'system', 
                content: 'You need to create only ONE SPECIFIC short-answer reading comprehension question that has a definite answer DIRECTLY from the passage.' 
            },
            { 
                role: 'user', 
                content: `Passage: ${text}`
            }
        ];

        const output2 = await generator(messages2, {
            max_new_tokens: 64,
            temperature: 0.1, 
            do_sample: false,
        });
        const question = output2[0].generated_text.at(-1).content
        self.postMessage({status: 'question generated', question: question});

    } else if(data.action === 'answer'){
        self.postMessage({status: 'generating answer'});
        const messages = [
            { 
                role: 'system', 
                content: 'You are a reading comprehension assistant. Generated question\'s answer must be included in the user\'s passage.' 
            },
            { 
                role: 'user', 
                content: `Passage: ${data.text} Question: ${data.question}\nRespond to the user\'s question directly using information from the user\'s passage.` 
            }
        ];
        const output = await generator(messages, {
            max_new_tokens: 100,
            temperature: 0.1,
            do_sample: false,
        });

        self.postMessage({status: 'checking your answer'});
        const answer = output[0].generated_text.at(-1).content;
        const messages2 = [
            {
                role: 'system',
                content: 'You are a teacher grading a reading comprehension test. Compare the student\'s answer to the correct answer key. Always respond with "INCORRECT" unless the student\'s answer share SOME meaning with the correct answer. If so, respond with "CORRECT".'
            },
            {
                role: 'user',
                content: `Question: ${data.question}\nCorrect Answer Key: ${answer}\nStudent's Answer: ${data.userAnswer}\n\nEvaluate the student's answer.`
            }
            ];

        const output2 = await generator(messages2, {
            max_new_tokens: 10,
            temperature: 0.1,
            do_sample: false
        });

        self.postMessage({status: 'done'});
        self.postMessage({judging: output2[0].generated_text.at(-1).content, answer: answer});
    }
};