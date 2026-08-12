import { Document } from "../models/Document.js";
import { Employee } from "../models/Employee.js";
import { EmployeeSkill } from "../models/EmployeeSkill.js";
import { User } from "../models/User.js";

export const recalculateProfileCompletion = async (employeeId: string) => {
  const employee = await Employee.findById(employeeId); if (!employee) return null;
  const [skillCount, certificateCount, documentCount, user] = await Promise.all([
    EmployeeSkill.countDocuments({ employee: employee._id, isActive: true }),
    Document.countDocuments({ employee: employee._id, category: "CERTIFICATE", isActive: true }),
    Document.countDocuments({ employee: employee._id, category: { $ne: "CERTIFICATE" }, isActive: true }),
    User.findById(employee.user).select("onboardingComplete").lean()
  ]);
  let score = 35;
  if (employee.personal?.personalEmail) score += 5; if (employee.personal?.address) score += 5; if (employee.personal?.emergencyContact) score += 5;
  if (employee.professionalSummary) score += 10; if (employee.previousExperience.length) score += 10; if (skillCount) score += 15;
  if (certificateCount) score += 5; if (documentCount) score += 5; if (user?.onboardingComplete) score += 5;
  employee.profileCompletion = Math.min(100, score); await employee.save(); return employee;
};
