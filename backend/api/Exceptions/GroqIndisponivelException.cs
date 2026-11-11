namespace BuildXP.API;

public sealed class GroqIndisponivelException : Exception
{
    public GroqIndisponivelException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
