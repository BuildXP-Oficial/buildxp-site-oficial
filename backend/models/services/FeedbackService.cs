using BuildXP.API.Data;
using BuildXP.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BuildXP.API.Services;

public class FeedbackService
{
    private readonly AppDbContext _context;

    // construtor — recebe o banco de dados por injeção de dependência
    public FeedbackService(AppDbContext context)
    {
        _context = context;
    }

    // lista todos os feedbacks — com filtro opcional por status
    public async Task<List<Feedback>> ListarAsync(StatusFeedback? status = null)
    {
        // começa a query — ainda não foi ao banco
        var query = _context.Feedbacks.AsQueryable();

        // se informou um status, filtra por ele
        if (status.HasValue)
        {
            query = query.Where(f => f.Status == status.Value);
        }

        // Mais recente primeiro: data da decisão (histórico) ou criação (pendentes)
        return await query
            .OrderByDescending(f => f.AvaliadoEm ?? f.CriadoEm)
            .ThenByDescending(f => f.Id)
            .ToListAsync();
    }

    // busca um feedback específico pelo ID
    public async Task<Feedback?> BuscarPorIdAsync(int id)
    {
        // FindAsync busca pela chave primária — mais rápido que Where
        return await _context.Feedbacks.FindAsync(id);
    }

    // aprova um feedback — torna visível no site
    public async Task<bool> AprovarAsync(int id, string moderador)
    {
        // busca o feedback pelo ID
        var feedback = await BuscarPorIdAsync(id);

        // se não encontrou, retorna false
        if (feedback is null)
            return false;

        // se já está aprovado, não faz nada
        if (feedback.Status == StatusFeedback.Aprovado)
            return false;

        // atualiza o status e a data de avaliação
        feedback.Status = StatusFeedback.Aprovado;
        feedback.AvaliadoEm = DateTime.UtcNow;
        feedback.ModeradoPor = moderador;

        // salva no banco
        await _context.SaveChangesAsync();

        return true;
    }

    // rejeita um feedback — não aparece no site
    public async Task<bool> RejeitarAsync(int id, string moderador)
    {
        var feedback = await BuscarPorIdAsync(id);

        if (feedback is null)
            return false;

        if (feedback.Status == StatusFeedback.Rejeitado)
            return false;

        feedback.Status = StatusFeedback.Rejeitado;
        feedback.AvaliadoEm = DateTime.UtcNow;
        feedback.ModeradoPor = moderador;

        await _context.SaveChangesAsync();

        return true;
    }
    // lista feedbacks aprovados — usado pela página pública do site
    public async Task<List<Feedback>> ListarAprovadosAsync()
    {
        return await _context.Feedbacks
            .Where(f => f.Status == StatusFeedback.Aprovado)
            .OrderByDescending(f => f.CriadoEm)
            .ToListAsync();
    }

    /// <summary>Evita gravar o mesmo envio duas vezes (duplo clique / pedido repetido).</summary>
    public async Task<bool> ExisteDuplicadoRecenteAsync(
        string nome,
        string categoria,
        string mensagem,
        int janelaSegundos = 90)
    {
        var msg = (mensagem ?? string.Empty).Trim();
        if (msg.Length == 0) return false;
        var n = (nome ?? string.Empty).Trim();
        var cat = (categoria ?? string.Empty).Trim();
        var desde = DateTime.UtcNow.AddSeconds(-janelaSegundos);
        return await _context.Feedbacks.AsNoTracking().AnyAsync(f =>
            f.CriadoEm >= desde &&
            f.Status == StatusFeedback.Pendente &&
            f.Mensagem == msg &&
            f.Nome == n &&
            f.Categoria == cat);
    }

    // salva novo feedback no banco
    public async Task<Feedback> CriarAsync(Feedback feedback)
    {
        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();
        return feedback;
    }

    /// <summary>Remove o feedback da base de dados (deixa de aparecer no mural público).</summary>
    public async Task<bool> ExcluirAsync(int id)
    {
        var feedback = await BuscarPorIdAsync(id);
        if (feedback is null)
            return false;

        _context.Feedbacks.Remove(feedback);
        await _context.SaveChangesAsync();
        return true;
    }
}