const getAllCampaigns = async () => {
  return [
    {
      id: 1,
      title: "Junior Golf Scholarship Fund",
      goalAmount: 25000,
      status: "active",
    },
    {
      id: 2,
      title: "Community Course Restoration",
      goalAmount: 40000,
      status: "draft",
    },
  ];
};

module.exports = {
  getAllCampaigns,
};
