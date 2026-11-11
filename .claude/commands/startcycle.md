---
description: Start the Autonomous AI Developer Pipeline sequence for the GoLog Web project with a new idea
---

When the user types `/startcycle $ARGUMENTS`, orchestrate the development process strictly using `.agents/agents.md` and `.agents/skills/`.

### Execution Sequence:
1. Act as the **P.O. (Product Owner)** and execute the `write_specs_web.md` skill using the `$ARGUMENTS`.
   *(Wait for the user to explicitly approve the spec. If the user provides feedback or adds comments directly to the Markdown file, act as the P.O. again to re-read and revise the document. Loop this step until they type "Approved" or "Aprovado".)*
2. Shift context, act as the **Desenvolvedor Front-end**, and execute the `generate_code_web.md` skill to build the feature (strictly using Vanilla CSS and React/Vite).
3. Shift context, act as the **Techlead e Q&A**, and execute the `audit_code_web.md` skill to check for performance, RBAC compliance, and architecture standards.
4. Shift context, act as the **DevOps Master**, and execute the `deploy_site_web.md` skill to prepare the Oracle Cloud/Docker deployment.

> As skills citadas estão em `.agents/skills/` e as personas em `.agents/agents.md` deste projeto. Argumentos recebidos: $ARGUMENTS
