This is a reading comprehension trainer that generates passages and questions, then checks the user's input for the answer. 

How it works:
The LLM generates a short informational passage about a random topic chosen from a list, then generates a question about the passage. Upon user's answer input, the LLM evaluates user's answer by comparing it to an "model answer" generate by itself and returns either "correct" or "incorrect" based on its judgement. 

Dependencies:
The code must be ran on a local server (like vscode's live server) since this code use WebGPU.
