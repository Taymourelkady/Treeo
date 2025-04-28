import { mockdata } from "./mockdata";
import { ChatQueryService } from "./chatQueryService";
import { detectVisualizationType } from "./chartDetection";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY = "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";

const SQL_EXTRACTION_PROMPT = `
You are an intelligent SQL agent connected to a Supabase PostgreSQL database. You can act both as a helpful assistant and a data analyst.

Your behavior depends on the type of user input:

---

1. **If the user asks a general or non-data-related question**  
(e.g., "hi", "what can you do?", "how are you?")  
→ Respond conversationally and helpfully like a normal AI assistant.  
→ Do NOT generate SQL.  
→ Do NOT mention charts.  

---

2. **If the user asks a data-related question**  
(e.g., anything about counts, metrics, trends, comparisons, summaries, etc.)  
→ Respond using the following strict format:
---SQL---
[SQL query]
---END SQL---
---CHART---  
[chart_type]  
---END CHART---

---

**Rules for SQL responses:**
- Do NOT include any explanation, commentary, markdown, or JSON.
- Do NOT use semicolons at the end of the SQL.
- Use only columns and tables from the schema provided.
- Use PostgreSQL functions like \`current_date\`, \`date_trunc\`, \`EXTRACT\`, etc.
- Join tables only using foreign key relationships shown (→).
- Do not wrap the SQL in code blocks (no backticks).

---

**Valid chart types:**
- \`metric\` → For single values (e.g., total sales, customer count)
- \`bar\` → For grouped comparisons (e.g., sales by category)
- \`line\` → For time trends (e.g., monthly revenue)
- \`pie\` → For proportions (e.g., revenue share by region)

---

**Examples:**
---SQL---
SELECT COUNT(*) FROM customers  
---END SQL--- 
---CHART---  
metric  
---END CHART---

---SQL---
SELECT category, SUM(price) FROM order_lines JOIN skus ON skus.id = sku_id GROUP BY category  
---END SQL--- 
---CHART---  
bar  
---END CHART---

---

Use only the following schema:

--- SCHEMA START ---
Table: orders  
- id (text)  
- customer_id → customers.id  
- order_date (date)  
- status (text)  
- created_at (timestamp)  

Table: order_lines  
- id (text)  
- order_id → orders.id  
- sku_id → skus.id  
- quantity (numeric)  
- price (numeric)  

Table: payments  
- id (text)  
- order_id → orders.id  
- supplier_id → suppliers.id  
- amount (numeric)  
- payment_type (text)  
- status (text)  
- created_at (timestamp)  

Table: suppliers  
- id (text)  
- name (text)  
- payment_type (text)  
- created_at (date)  

Table: skus  
- id (text)  
- name (text)  
- unit (text)  
- category (text)  
- created_at (date)  

Table: supplier_skus  
- id (text)  
- supplier_id → suppliers.id  
- sku_id → skus.id  
- base_price (numeric)  

Table: inventory  
- id (text)  
- sku_id → skus.id  
- stock_level (numeric)  
- restock_date (date)  

Table: customers  
- id (text)  
- name (text)  
- cuisine_id → cuisines.id  
- branch_count (int)  
- created_at (date)  
- sales_person_id → sales_people.id  

Table: sales_people  
- id (text)  
- name (text)  
- email (text)  
- phone (text)  

Table: cuisines  
- id (text)  
- name (text)  

Table: contacts  
- id (text)  
- customer_id → customers.id  
- name (text)  
- role (text)  
- phone (text)  
- email (text)  
--- SCHEMA END ---
`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  visualization?: {
    type: "line" | "bar" | "pie" | "metric";
    data: {
      labels: string[];
      datasets: Array<{
        label?: string;
        data: number[];
        backgroundColor?: string[];
        borderColor?: string;
      }>;
    };
  };
}

export interface ParsedAIResponse {
  explanation: string;
  sql: string | null;
  chartType?: string | null;
}

export function parseAIResponse(response: string): ParsedAIResponse {
  const explanationMatch = response.match(
    /---EXPLANATION---([\s\S]*?)(?:---SQL---|$)/
  );
  const sqlMatch = response.match(/---SQL---([\s\S]*?)---END SQL---/);
  const chartMatch = response.match(/---CHART---([\s\S]*?)---END CHART---/);

  return {
    explanation: explanationMatch
      ? explanationMatch[1].trim()
      : response.trim(),
    sql: sqlMatch ? sqlMatch[1].trim().replace(/;$/, "").trim() : null,
    chartType: chartMatch ? chartMatch[1].trim() : null,
  };
}

export async function chat(messages: ChatMessage[]): Promise<ChatMessage> {
  try {
    // Get AI response first
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://tree.new",
        "X-Title": "Tree - Business Intelligence Platform",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: SQL_EXTRACTION_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `AI API request failed: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ""
        }`
      );
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from AI API");
    }

    const aiResponse = data.choices[0].message.content;
    const { sql, explanation, chartType } = parseAIResponse(aiResponse);

    if (sql) {
      const result = await mockdata.query(sql);
      if (result.error) {
        throw result.error;
      }

      const content = `
        ${explanation}

        Here's the SQL query I used:
        \`\`\`sql
        ${sql}
        \`\`\`

        Results:
        \`\`\`json
        ${JSON.stringify(result.data, null, 2)}
        \`\`\`
        ${chartType
          ? `\nI suggest visualizing this data as a ${chartType}.\n`
          : ""
        }
        `.trim();
      return {
        role: "assistant",
        content,
        visualization: transformSQLResults(result.data, chartType),
      };
    }

    return { role: "assistant", content: aiResponse };
  } catch (error) {
    console.error("AI chat error:", error);
    throw error;
  }
}

function transformSQLResults(data: any[], chartType?: string) {
  if (!data?.length || !chartType) return undefined;

  const columns = Object.keys(data[0]);

  switch (chartType) {
    case "metric":
      return {
        type: "metric",
        data: {
          labels: [],
          datasets: [
            {
              data: [Number(Object.values(data[0])[0])],
              backgroundColor: ["#167147"],
            },
          ],
        },
      };

    case "pie":
      return {
        type: "pie",
        data: {
          labels: data.map((row) => String(Object.values(row)[0])),
          datasets: [
            {
              data: data.map((row) => Number(Object.values(row)[1])),
              backgroundColor: [
                "#167147",
                "#4E7BE9",
                "#4EE997",
                "#E94E7B",
                "#7BE94E",
                "#E9974E",
              ],
            },
          ],
        },
      };

    case "bar":
      return {
        type: "bar",
        data: {
          labels: data.map((row) => String(Object.values(row)[0])),
          datasets: [
            {
              data: data.map((row) => Number(Object.values(row)[1])),
              backgroundColor: "#167147",
            },
          ],
        },
      };

    case "line":
    default:
      return {
        type: "line",
        data: {
          labels: data.map((row) => String(Object.values(row)[0])),
          datasets: [
            {
              data: data.map((row) => Number(Object.values(row)[1])),
              borderColor: "#167147",
              tension: 0.4,
              pointRadius: 0,
              borderWidth: 2,
            },
          ],
        },
      };
  }
}
