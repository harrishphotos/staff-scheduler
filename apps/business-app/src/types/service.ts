export type Service = {
  serviceId: string; // Unique identifier for the service
  serviceName: string; // Name of the service
  duration: number; // Duration of the service in minutes
  price: number; // Price of the service
  isPackaged: boolean; // Indicates if the service is part of a package
};

export const services: Service[] = [
  {
    serviceId: "3f1e52e0-7a8a-4c85-9841-f50b3e05dabb",
    serviceName: "Haircut",
    duration: 30,
    price: 600,
    isPackaged: false,
  },
  {
    serviceId: "f7454a8e-d9b0-4a30-9212-1f5a47c9e71d",
    serviceName: "Shave",
    duration: 20,
    price: 650,
    isPackaged: false,
  },
  {
    serviceId: "62cfa3ec-cbfb-42f7-8d30-e391f8416b4f",
    serviceName: "Facial",
    duration: 45,
    price: 1200,
    isPackaged: false,
  },
  {
    serviceId: "6dbd9d1c-9e52-4bd3-850d-0b0935d93929",
    serviceName: "Manicure",
    duration: 40,
    price: 800,
    isPackaged: false,
  },
  {
    serviceId: "S005",
    serviceName: "Pedicure",
    duration: 50,
    price: 900,
    isPackaged: false,
  },
  {
    serviceId: "S006",
    serviceName: "Hair Coloring",
    duration: 60,
    price: 1500,
    isPackaged: false,
  },
  {
    serviceId: "S007",
    serviceName: "Hair Styling",
    duration: 40,
    price: 700,
    isPackaged: false,
  },
  {
    serviceId: "S008",
    serviceName: "Beard Trim",
    duration: 25,
    price: 600,
    isPackaged: false,
  },
  {
    serviceId: "S009",
    serviceName: "Eyebrow Threading",
    duration: 15,
    price: 600,
    isPackaged: false,
  },
  {
    serviceId: "S010",
    serviceName: "Waxing - Arms",
    duration: 30,
    price: 1000,
    isPackaged: false,
  },
  {
    serviceId: "S011",
    serviceName: "Waxing - Legs",
    duration: 40,
    price: 1200,
    isPackaged: false,
  },
  {
    serviceId: "S012",
    serviceName: "Massage - Head",
    duration: 30,
    price: 800,
    isPackaged: false,
  },
  {
    serviceId: "S013",
    serviceName: "Massage - Back",
    duration: 45,
    price: 1100,
    isPackaged: false,
  },
  {
    serviceId: "S014",
    serviceName: "Massage - Full Body",
    duration: 90,
    price: 2500,
    isPackaged: false,
  },
  {
    serviceId: "S015",
    serviceName: "Hair Spa",
    duration: 60,
    price: 1800,
    isPackaged: false,
  },
  {
    serviceId: "S016",
    serviceName: "Nail Art",
    duration: 50,
    price: 1000,
    isPackaged: false,
  },
  {
    serviceId: "S017",
    serviceName: "Skin Treatment",
    duration: 60,
    price: 2000,
    isPackaged: false,
  },
  {
    serviceId: "S018",
    serviceName: "Makeup Application",
    duration: 90,
    price: 3000,
    isPackaged: false,
  },
  {
    serviceId: "S019",
    serviceName: "Hair Straightening",
    duration: 120,
    price: 4000,
    isPackaged: false,
  },
  {
    serviceId: "S020",
    serviceName: "Hair Perming",
    duration: 120,
    price: 3500,
    isPackaged: false,
  },

  // Packaged services (isPackaged: true)
  {
    serviceId: "P001",
    serviceName: "Bridal Package",
    duration: 240,
    price: 10000,
    isPackaged: true,
  },
  {
    serviceId: "P002",
    serviceName: "Party Makeup Package",
    duration: 180,
    price: 8000,
    isPackaged: true,
  },
  {
    serviceId: "P003",
    serviceName: "Relaxation Package",
    duration: 120,
    price: 5000,
    isPackaged: true,
  },
  {
    serviceId: "P004",
    serviceName: "Skin Glow Package",
    duration: 150,
    price: 7000,
    isPackaged: true,
  },
  {
    serviceId: "P005",
    serviceName: "Hair Care Package",
    duration: 180,
    price: 6000,
    isPackaged: true,
  },
];
