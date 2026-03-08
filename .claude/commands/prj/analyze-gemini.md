---
description: Run the Gemini CLI and return the response.
argument-hint: [prompt content to send]
allowed-tools: Bash
---

# Task
The user has requested the following prompt to be sent to Gemini:
"$ARGUMENTS"

# Instructions
1. Use the Bash tool to execute the `gemini` CLI command installed on the system.
2. Construct the command as `gemini "$ARGUMENTS"`. (Adjust the command structure based on the installed Gemini CLI version)
3. Read the output returned by the Gemini CLI through the terminal (Bash).
4. Summarize the result in the context of the current task, or present the raw output directly to the user.
