const API_TOKEN = '6c62a7ba-5128-4f3c-864b-01876e7a1832-eda921d0-26e0-4d99-9668-f9cf1c4c8aaa';

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Lidar com preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verificar se é método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método não permitido. Use GET.' 
    });
  }

  try {
    const { cnpj } = req.query;

    console.log('🔍 CNPJ recebido:', cnpj);

    // Validar CNPJ
    if (!cnpj) {
      return res.status(400).json({ 
        error: true, 
        message: 'CNPJ não informado' 
      });
    }

    // Validar formato do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({ 
        error: true, 
        message: 'CNPJ deve conter 14 dígitos' 
      });
    }

    console.log('🚀 Consultando API CNPJa para:', cnpjLimpo);

    // USANDO O ENDPOINT CORRETO
    const apiUrl = `https://open.cnpja.com/office/${cnpjLimpo}`;
    console.log('📡 URL da API:', apiUrl);
    console.log('🔑 Token:', API_TOKEN.substring(0, 10) + '...');

    // Fazer requisição para a API CNPJa
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Consulta-CNPJ-App/1.0'
      },
    });

    console.log('📊 Status da API:', apiResponse.status);
    console.log('📋 Status Text:', apiResponse.statusText);
    
    // Log de headers para debug
    const headers = {};
    apiResponse.headers.forEach((value, name) => {
      headers[name] = value;
    });
    console.log('📨 Headers da resposta:', headers);

    // Verificar o tipo de conteúdo
    const contentType = apiResponse.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);

    if (!apiResponse.ok) {
      let errorData;
      let responseBody;
      
      try {
        responseBody = await apiResponse.text();
        console.log('❌ Corpo da resposta de erro:', responseBody);
        
        if (responseBody) {
          errorData = JSON.parse(responseBody);
        }
      } catch (parseError) {
        console.log('⚠️ Não foi possível parsear resposta como JSON:', parseError);
        errorData = { message: responseBody || 'Erro desconhecido' };
      }

      let errorMessage = 'Erro na consulta à API';
      
      if (apiResponse.status === 404) {
        errorMessage = 'Empresa não encontrada para o CNPJ informado';
      } else if (apiResponse.status === 401) {
        errorMessage = 'Token de API inválido ou expirado';
      } else if (apiResponse.status === 403) {
        errorMessage = 'Acesso não autorizado à API';
      } else if (apiResponse.status === 429) {
        errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = `Erro ${apiResponse.status}: ${apiResponse.statusText}`;
      }

      return res.status(apiResponse.status).json({
        error: true,
        message: errorMessage,
        status: apiResponse.status
      });
    }

    // Se chegou aqui, a resposta é OK (200-299)
    let data;
    let responseBody;
    
    try {
      responseBody = await apiResponse.text();
      console.log('✅ Corpo da resposta (primeiros 500 chars):', responseBody.substring(0, 500));
      
      data = JSON.parse(responseBody);
      console.log('📦 Dados parseados com sucesso');
      
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      return res.status(500).json({
        error: true,
        message: 'Resposta da API inválida',
        rawResponse: responseBody
      });
    }

    // Retornar dados formatados
    return res.status(200).json({
      error: false,
      data: data
    });

  } catch (error) {
    console.error('💥 Erro interno:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
};
