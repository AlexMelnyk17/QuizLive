namespace QuizLive.Server.Application.Stats
{
    internal static class OpenTextAnswerGrouper
    {
        private const int QuizLevelTopN = 40;

        public static (List<OpenAnswerFrequencyDto> Answers, int OtherCount) GroupForQuiz(
            IReadOnlyList<(string Text, bool IsHidden)> rows)
        {
            var (visible, _) = BuildVisibleFrequencies(rows);
            return ApplyTopN(visible, QuizLevelTopN);
        }

        public static List<OpenAnswerFrequencyDto> GroupForGame(
            IReadOnlyList<(string Text, bool IsHidden)> rows)
        {
            return BuildVisibleFrequencies(rows).Visible;
        }

        public static int CountHidden(IReadOnlyList<(string Text, bool IsHidden)> rows) =>
            rows.Count(r => r.IsHidden);

        private static (List<OpenAnswerFrequencyDto> Visible, int HiddenCount) BuildVisibleFrequencies(
            IReadOnlyList<(string Text, bool IsHidden)> rows)
        {
            var visibleGroups = new Dictionary<string, List<string>>(StringComparer.Ordinal);
            var hiddenCount = 0;

            foreach (var (text, isHidden) in rows)
            {
                if (isHidden)
                {
                    hiddenCount++;
                    continue;
                }

                var trimmed = text.Trim();
                if (trimmed.Length == 0)
                {
                    continue;
                }

                var key = trimmed.ToLowerInvariant();
                if (!visibleGroups.TryGetValue(key, out var originals))
                {
                    originals = [];
                    visibleGroups[key] = originals;
                }

                originals.Add(text);
            }

            var visible = visibleGroups
                .Select(pair => new OpenAnswerFrequencyDto(
                    PickDisplayText(pair.Value),
                    pair.Value.Count))
                .OrderByDescending(f => f.Count)
                .ThenBy(f => f.Text, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return (visible, hiddenCount);
        }

        private static (List<OpenAnswerFrequencyDto> Answers, int OtherCount) ApplyTopN(
            List<OpenAnswerFrequencyDto> visible,
            int topN)
        {
            if (visible.Count <= topN)
            {
                return (visible, 0);
            }

            var top = visible.Take(topN).ToList();
            var otherCount = visible.Skip(topN).Sum(f => f.Count);
            return (top, otherCount);
        }

        private static string PickDisplayText(List<string> originals)
        {
            return originals
                .GroupBy(t => t, StringComparer.Ordinal)
                .OrderByDescending(g => g.Count())
                .ThenBy(g => g.Key, StringComparer.Ordinal)
                .First()
                .Key;
        }
    }
}