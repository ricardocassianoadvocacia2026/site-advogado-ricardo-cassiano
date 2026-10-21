import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Trata requisição pre-flight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { nome, whatsapp, apenas_contato, descricao_caso, _hp } = body;

    // 1. Verificação contra Bots/Spam (Honeypot)
    if (_hp && String(_hp).trim() !== "") {
      // Retorna sucesso falso sem gravar para despistar bots
      return new Response(
        JSON.stringify({ success: true, message: "Solicitação recebida com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validação rigorosa dos campos obrigatórios
    const nomeLimpo = typeof nome === "string" ? nome.trim() : "";
    if (nomeLimpo.length < 2 || nomeLimpo.length > 150) {
      return new Response(
        JSON.stringify({ error: "O nome completo é obrigatório e deve ter entre 2 e 150 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whatsappLimpo = typeof whatsapp === "string" ? whatsapp.trim() : "";
    const apenasDigitos = whatsappLimpo.replace(/\D/g, "");
    if (apenasDigitos.length < 10 || apenasDigitos.length > 15) {
      return new Response(
        JSON.stringify({ error: "Informe um número de WhatsApp válido com DDD (mínimo 10 dígitos)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apenasContato = Boolean(apenas_contato);
    let descricaoLimpa: string | null = null;
    if (!apenasContato && typeof descricao_caso === "string" && descricao_caso.trim() !== "") {
      descricaoLimpa = descricao_caso.trim();
      if (descricaoLimpa.length > 3000) {
        return new Response(
          JSON.stringify({ error: "A descrição do caso não pode ultrapassar 3000 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Conecta ao Supabase usando as variáveis de ambiente padrão do Edge Runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Configurações do Supabase ausentes no runtime da Edge Function.");
      return new Response(
        JSON.stringify({ error: "Erro de configuração no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Insere o registro na tabela solicitacoes
    const { data, error } = await supabase
      .from("solicitacoes")
      .insert([
        {
          nome: nomeLimpo,
          whatsapp: whatsappLimpo,
          apenas_contato: apenasContato,
          descricao_caso: descricaoLimpa,
          status: "Novo",
        },
      ])
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Erro ao inserir solicitação:", error);
      return new Response(
        JSON.stringify({ error: "Não foi possível registrar a solicitação no momento. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitação enviada com sucesso! Entraremos em contato assim que possível.",
        solicitacao_id: data.id,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro inesperado na Edge Function:", err);
    return new Response(
      JSON.stringify({ error: "Dados inválidos fornecidos." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
