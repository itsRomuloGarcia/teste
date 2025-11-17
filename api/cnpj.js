const API_TOKEN =
  "6c62a7ba-5128-4f3c-864b-01876e7a1832-eda921d0-26e0-4d99-9668-f9cf1c4c8aaa";

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Lidar com preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Verificar se é método GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { cnpj } = req.query;

    // Validar CNPJ
    if (!cnpj) {
      return res.status(400).json({
        error: true,
        message: "CNPJ não informado",
      });
    }

    // Validar formato do CNPJ (apenas números, 14 dígitos)
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({
        error: true,
        message: "CNPJ deve conter 14 dígitos",
      });
    }

    // Fazer requisição para a API CNPJa
    const response = await fetch(`https://api.cnpja.com/office/${cnpjLimpo}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (response.status === 404) {
        return res.status(404).json({
          error: true,
          message: "Empresa não encontrada",
        });
      }

      if (response.status === 401) {
        return res.status(401).json({
          error: true,
          message: "Token de API inválido",
        });
      }

      return res.status(response.status).json({
        error: true,
        message: errorData.message || "Erro na consulta",
      });
    }

    const data = await response.json();

    // Retornar dados formatados
    res.status(200).json({
      error: false,
      data: data,
    });
  } catch (error) {
    console.error("Erro interno:", error);
    res.status(500).json({
      error: true,
      message: "Erro interno do servidor",
    });
  }
}
