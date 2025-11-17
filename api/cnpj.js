const API_TOKEN =
  "6c62a7ba-5128-4f3c-864b-01876e7a1832-eda921d0-26e0-4d99-9668-f9cf1c4c8aaa";

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Lidar com preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Verificar se é método GET
  if (req.method !== "GET") {
    return res.status(405).json({
      error: true,
      message: "Método não permitido. Use GET.",
    });
  }

  try {
    const { cnpj } = req.query;

    console.log("CNPJ recebido:", cnpj);

    // Validar CNPJ
    if (!cnpj) {
      return res.status(400).json({
        error: true,
        message: "CNPJ não informado",
      });
    }

    // Validar formato do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({
        error: true,
        message: "CNPJ deve conter 14 dígitos",
      });
    }

    console.log("Consultando API CNPJa para:", cnpjLimpo);

    // USANDO O ENDPOINT CORRETO DA DOCUMENTAÇÃO
    const apiUrl = `https://open.cnpja.com/office/${cnpjLimpo}`;
    console.log("URL da API:", apiUrl);

    // Fazer requisição para a API CNPJa CORRETA
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Status da API:", apiResponse.status);
    console.log("Headers:", Object.fromEntries(apiResponse.headers));

    if (!apiResponse.ok) {
      let errorMessage = "Erro na consulta à API";

      if (apiResponse.status === 404) {
        errorMessage = "Empresa não encontrada para o CNPJ informado";
      } else if (apiResponse.status === 401) {
        errorMessage = "Token de API inválido ou expirado";
      } else if (apiResponse.status === 429) {
        errorMessage =
          "Limite de requisições excedido. Tente novamente mais tarde.";
      } else {
        try {
          const errorData = await apiResponse.json();
          errorMessage = errorData.message || `Erro ${apiResponse.status}`;
        } catch (e) {
          errorMessage = `Erro ${apiResponse.status}: ${apiResponse.statusText}`;
        }
      }

      return res.status(apiResponse.status).json({
        error: true,
        message: errorMessage,
      });
    }

    const data = await apiResponse.json();
    console.log("Dados recebidos com sucesso");

    // Retornar dados formatados
    return res.status(200).json({
      error: false,
      data: data,
    });
  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({
      error: true,
      message: "Erro interno do servidor: " + error.message,
    });
  }
};
