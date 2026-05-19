function buildLectureProgress_(currentLectures, totalLectures) {
  const current = Number(currentLectures || 0);
  const total = Number(totalLectures || 16);
  return {
    current,
    total,
    percent: total ? Math.min(100, Math.round((current / total) * 100)) : 0
  };
}
