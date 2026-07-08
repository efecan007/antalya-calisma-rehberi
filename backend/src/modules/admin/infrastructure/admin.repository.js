class AdminRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getDashboardCounts() {
    const [totalUsers, totalPlaces, pendingSuggestions, totalReviews, totalFavorites] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.place.count({ where: { status: 'APPROVED' } }),
      this.prisma.place.count({ where: { status: 'PENDING' } }),
      this.prisma.review.count(),
      this.prisma.favorite.count(),
    ]);

    return { totalUsers, totalPlaces, pendingSuggestions, totalReviews, totalFavorites };
  }
}

module.exports = AdminRepository;
