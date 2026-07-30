import { regionRepository } from "../repositories/region.repository";
import { calculatePagination } from "../lib/pagination";

export const regionService = {
  getAllProvinces() {
    const data = regionRepository.findAllProvinces();
    return { data, meta: calculatePagination(data.length, 1, data.length) };
  },

  getProvinceByCode(code: string) {
    return regionRepository.findProvinceByCode(code);
  },

  getRegenciesByProvince(provinceCode: string, page: number, limit: number) {
    const { data, total } = regionRepository.findRegenciesByProvince(provinceCode, page, limit);
    return { data, meta: calculatePagination(total, page, limit) };
  },

  getRegencyByCode(code: string) {
    return regionRepository.findRegencyByCode(code);
  },

  getDistrictsByRegency(regencyCode: string, page: number, limit: number) {
    const { data, total } = regionRepository.findDistrictsByRegency(regencyCode, page, limit);
    return { data, meta: calculatePagination(total, page, limit) };
  },

  getDistrictByCode(code: string) {
    return regionRepository.findDistrictByCode(code);
  },

  getVillagesByDistrict(districtCode: string, page: number, limit: number) {
    const { data, total } = regionRepository.findVillagesByDistrict(districtCode, page, limit);
    return { data, meta: calculatePagination(total, page, limit) };
  },

  getVillageByCode(code: string) {
    return regionRepository.findVillageByCode(code);
  },

  searchRegions(q: string, type: string | undefined, page: number, limit: number) {
    const { data, total } = regionRepository.searchRegions(q, type, page, limit);
    return { data, meta: calculatePagination(total, page, limit) };
  },

  getVillagesByPostalCode(postalCode: string, page: number, limit: number) {
    const { data, total } = regionRepository.findVillagesByPostalCode(postalCode, page, limit);
    return { data, meta: calculatePagination(total, page, limit) };
  },
};
