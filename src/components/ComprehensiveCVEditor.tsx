// Comprehensive CV Editor with Interactive Sections
import React, { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap,
  Award, Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, 
  Star, RotateCcw, Calendar, Building, Target, CheckCircle
} from 'lucide-react';
import { 
  ComprehensiveCV, 
  WorkExperience, 
  Education, 
  Qualification, 
  PersonalInfo,
  SkillCategories 
} from '../lib/real-claude-cv-parser';

interface ComprehensiveCVEditorProps {
  cvData: ComprehensiveCV;
  onUpdate: (updatedCV: ComprehensiveCV) => void;
  onSave: () => void;
  saving?: boolean;
}

export default function ComprehensiveCVEditor({ 
  cvData, 
  onUpdate, 
  onSave, 
  saving = false 
}: ComprehensiveCVEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['personalInfo', 'professionalSummary'])
  );
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [editingQualification, setEditingQualification] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    const updated = {
      ...cvData,
      personalInfo: {
        ...cvData.personalInfo,
        [field]: value
      }
    };
    onUpdate(updated);
  };

  const updateProfessionalSummary = (summary: string) => {
    const updated = {
      ...cvData,
      professionalSummary: summary
    };
    onUpdate(updated);
  };

  const addExperience = () => {
    const newExp: WorkExperience = {
      id: Math.random().toString(36).substr(2, 9),
      jobTitle: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      achievements: [],
      responsibilities: [],
      technologies: [],
      autoExtracted: false
    };
    
    const updated = {
      ...cvData,
      experience: [...cvData.experience, newExp]
    };
    onUpdate(updated);
    setEditingExperience(newExp.id);
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    const updated = {
      ...cvData,
      experience: cvData.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    };
    onUpdate(updated);
  };

  const removeExperience = (id: string) => {
    if (confirm('Are you sure you want to remove this experience?')) {
      const updated = {
        ...cvData,
        experience: cvData.experience.filter(exp => exp.id !== id)
      };
      onUpdate(updated);
    }
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Math.random().toString(36).substr(2, 9),
      degree: '',
      institution: '',
      year: '',
      details: '',
      autoExtracted: false
    };
    
    const updated = {
      ...cvData,
      education: [...cvData.education, newEdu]
    };
    onUpdate(updated);
    setEditingEducation(newEdu.id);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    const updated = {
      ...cvData,
      education: cvData.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    };
    onUpdate(updated);
  };

  const removeEducation = (id: string) => {
    if (confirm('Are you sure you want to remove this education entry?')) {
      const updated = {
        ...cvData,
        education: cvData.education.filter(edu => edu.id !== id)
      };
      onUpdate(updated);
    }
  };

  const updateSkills = (category: keyof SkillCategories, skills: string[]) => {
    const updated = {
      ...cvData,
      skills: {
        ...cvData.skills,
        [category]: skills
      }
    };
    onUpdate(updated);
  };

  const addQualification = () => {
    const newQual: Qualification = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      issuer: '',
      year: '',
      details: '',
      autoExtracted: false
    };
    
    const updated = {
      ...cvData,
      qualifications: [...cvData.qualifications, newQual]
    };
    onUpdate(updated);
    setEditingQualification(newQual.id);
  };

  const updateQualification = (id: string, field: keyof Qualification, value: any) => {
    const updated = {
      ...cvData,
      qualifications: cvData.qualifications.map(qual =>
        qual.id === id ? { ...qual, [field]: value } : qual
      )
    };
    onUpdate(updated);
  };

  const removeQualification = (id: string) => {
    if (confirm('Are you sure you want to remove this qualification?')) {
      const updated = {
        ...cvData,
        qualifications: cvData.qualifications.filter(qual => qual.id !== id)
      };
      onUpdate(updated);
    }
  };

  const ConfidenceIndicator = ({ score, label }: { score: number; label: string }) => {
    const getColor = (score: number) => {
      if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
      if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      return 'text-red-600 bg-red-100 border-red-200';
    };

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getColor(score)}`}>
        <Star className="h-3 w-3 mr-1" />
        {label}: {score}%
      </div>
    );
  };

  const SectionHeader = ({ 
    title, 
    icon: Icon, 
    section, 
    confidence, 
    onAdd 
  }: { 
    title: string; 
    icon: any; 
    section: string; 
    confidence?: number;
    onAdd?: () => void;
  }) => {
    const isExpanded = expandedSections.has(section);
    
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => toggleSection(section)}
            className="flex items-center space-x-2 text-lg font-semibold text-primary hover:text-purple-600"
          >
            <Icon className="h-5 w-5 text-purple-600" />
            <span>{title}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {confidence !== undefined && (
            <ConfidenceIndicator score={confidence} label="AI Confidence" />
          )}
        </div>
        {onAdd && isExpanded && (
          <button
            onClick={onAdd}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        )}
      </div>
    );
  };

  const ExperienceCard = ({ experience }: { experience: WorkExperience }) => {
    const isEditing = editingExperience === experience.id;
    
    if (isEditing) {
      return (
        <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Job Title</label>
              <input
                type="text"
                value={experience.jobTitle}
                onChange={(e) => updateExperience(experience.id, 'jobTitle', e.target.value)}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Company</label>
              <input
                type="text"
                value={experience.company}
                onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Start Date</label>
              <input
                type="text"
                value={experience.startDate}
                onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="MM/YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">End Date</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={experience.endDate}
                  onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                  disabled={experience.current}
                  className="flex-1 px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="MM/YYYY"
                />
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={experience.current}
                    onChange={(e) => {
                      updateExperience(experience.id, 'current', e.target.checked);
                      if (e.target.checked) {
                        updateExperience(experience.id, 'endDate', 'Present');
                      }
                    }}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span>Current</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-2 pt-3 border-t">
            <button
              onClick={() => setEditingExperience(null)}
              className="px-3 py-1 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingExperience(null)}
              className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 border border-secondary rounded-lg hover:border-purple-300 transition-colors group">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-primary flex items-center">
              {experience.jobTitle}
              {experience.autoExtracted && (
                <CheckCircle className="h-4 w-4 text-green-600 ml-2" title="Auto-extracted by AI" />
              )}
            </h4>
            <p className="text-purple-600 dark:text-purple-400 flex items-center">
              <Building className="h-4 w-4 mr-1" />
              {experience.company}
            </p>
            <p className="text-sm text-secondary flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {experience.startDate} - {experience.endDate}
            </p>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingExperience(experience.id)}
              className="p-1 text-secondary hover:text-primary rounded"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => removeExperience(experience.id)}
              className="p-1 text-secondary hover:text-red-600 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {experience.achievements.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-secondary mb-1">Key Achievements:</p>
            <ul className="text-sm text-secondary space-y-1">
              {experience.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start">
                  <Target className="h-3 w-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-primary rounded-xl shadow-sm overflow-hidden">
        <SectionHeader
          title="Personal Information"
          icon={User}
          section="personalInfo"
          confidence={cvData.confidence.personalInfo}
        />
        
        {expandedSections.has('personalInfo') && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  value={cvData.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={cvData.personalInfo.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Phone</label>
                <input
                  type="tel"
                  value={cvData.personalInfo.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Location</label>
                <input
                  type="text"
                  value={cvData.personalInfo.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="City, State/Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={cvData.personalInfo.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Website</label>
                <input
                  type="url"
                  value={cvData.personalInfo.website || ''}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="yourwebsite.com"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Professional Summary */}
      <div className="bg-primary rounded-xl shadow-sm overflow-hidden">
        <SectionHeader
          title="Professional Summary"
          icon={Briefcase}
          section="professionalSummary"
          confidence={cvData.confidence.professionalSummary}
        />
        
        {expandedSections.has('professionalSummary') && (
          <div className="p-6">
            <textarea
              value={cvData.professionalSummary}
              onChange={(e) => updateProfessionalSummary(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Write a compelling professional summary highlighting your key experience, skills, and career objectives..."
            />
          </div>
        )}
      </div>

      {/* Work Experience */}
      <div className="bg-primary rounded-xl shadow-sm overflow-hidden">
        <SectionHeader
          title={`Work Experience (${cvData.experience.length})`}
          icon={Briefcase}
          section="experience"
          confidence={cvData.confidence.experience}
          onAdd={addExperience}
        />
        
        {expandedSections.has('experience') && (
          <div className="p-6 space-y-4">
            {cvData.experience.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No work experience added yet</p>
                <button
                  onClick={addExperience}
                  className="mt-2 text-purple-600 hover:text-purple-700"
                >
                  Add your first experience
                </button>
              </div>
            ) : (
              cvData.experience.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="bg-primary rounded-xl shadow-sm overflow-hidden">
        <SectionHeader
          title="Skills"
          icon={Target}
          section="skills"
          confidence={cvData.confidence.skills}
        />
        
        {expandedSections.has('skills') && (
          <div className="p-6 space-y-4">
            {/* Technical Skills */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Technical Skills</label>
              <input
                type="text"
                value={cvData.skills.technical?.join(', ') || ''}
                onChange={(e) => updateSkills('technical', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="JavaScript, Python, React, AWS, SQL..."
              />
            </div>
            
            {/* Leadership Skills */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Leadership Skills</label>
              <input
                type="text"
                value={cvData.skills.leadership?.join(', ') || ''}
                onChange={(e) => updateSkills('leadership', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Team Leadership, Project Management, Strategic Planning..."
              />
            </div>
            
            {/* Business Skills */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Business Skills</label>
              <input
                type="text"
                value={cvData.skills.business?.join(', ') || ''}
                onChange={(e) => updateSkills('business', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Business Analysis, Revenue Optimization, Market Research..."
              />
            </div>
            
            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Languages</label>
              <input
                type="text"
                value={cvData.skills.languages?.join(', ') || ''}
                onChange={(e) => updateSkills('languages', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="English (Native), Spanish (Fluent), French (Conversational)..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-primary rounded-xl shadow-sm overflow-hidden">
        <SectionHeader
          title={`Education (${cvData.education.length})`}
          icon={GraduationCap}
          section="education"
          confidence={cvData.confidence.education}
          onAdd={addEducation}
        />
        
        {expandedSections.has('education') && (
          <div className="p-6 space-y-4">
            {cvData.education.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No education entries added yet</p>
                <button
                  onClick={addEducation}
                  className="mt-2 text-purple-600 hover:text-purple-700"
                >
                  Add your first education entry
                </button>
              </div>
            ) : (
              cvData.education.map((edu) => {
                const isEditing = editingEducation === edu.id;
                
                if (isEditing) {
                  return (
                    <div key={edu.id} className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Degree/Qualification</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Bachelor of Science in Computer Science"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="University/School Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Year/Duration</label>
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="2020 or 2018-2022"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">GPA (Optional)</label>
                          <input
                            type="text"
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="3.8/4.0"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-1">Honors/Details (Optional)</label>
                        <input
                          type="text"
                          value={edu.honors || ''}
                          onChange={(e) => updateEducation(edu.id, 'honors', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Magna Cum Laude, Dean's List, etc."
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-1">Additional Details (Optional)</label>
                        <textarea
                          value={edu.details || ''}
                          onChange={(e) => updateEducation(edu.id, 'details', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Relevant coursework, thesis, projects, etc."
                        />
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                        <button
                          onClick={() => setEditingEducation(null)}
                          className="px-3 py-1 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingEducation(null)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={edu.id} className="p-4 border border-secondary rounded-lg hover:border-purple-300 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary flex items-center">
                          {edu.degree}
                          {edu.autoExtracted && (
                            <CheckCircle className="h-4 w-4 text-green-600 ml-2" title="Auto-extracted by AI" />
                          )}
                        </h4>
                        <p className="text-purple-600 dark:text-purple-400 flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {edu.institution}
                        </p>
                        <p className="text-sm text-secondary flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {edu.year}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingEducation(edu.id)}
                          className="p-1 text-secondary hover:text-primary rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="p-1 text-secondary hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {edu.details && (
                      <div className="mt-2">
                        <p className="text-sm text-secondary">{edu.details}</p>
                      </div>
                    )}
                    
                    {(edu.gpa || edu.honors) && (
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        {edu.gpa && (
                          <span className="text-green-600 dark:text-green-400">GPA: {edu.gpa}</span>
                        )}
                        {edu.honors && (
                          <span className="text-purple-600 dark:text-purple-400">{edu.honors}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Qualifications */}
      <div className="bg-primary rounded-xl shadow-sm overflow-hidden">
        <SectionHeader
          title={`Certifications & Qualifications (${cvData.qualifications.length})`}
          icon={Award}
          section="qualifications"
          confidence={cvData.confidence.qualifications}
          onAdd={addQualification}
        />
        
        {expandedSections.has('qualifications') && (
          <div className="p-6 space-y-4">
            {cvData.qualifications.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No qualifications added yet</p>
                <button
                  onClick={addQualification}
                  className="mt-2 text-purple-600 hover:text-purple-700"
                >
                  Add your first qualification
                </button>
              </div>
            ) : (
              cvData.qualifications.map((qual) => {
                const isEditing = editingQualification === qual.id;
                
                if (isEditing) {
                  return (
                    <div key={qual.id} className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Certification/License Name</label>
                          <input
                            type="text"
                            value={qual.name}
                            onChange={(e) => updateQualification(qual.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Project Management Professional (PMP)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Issuing Organization</label>
                          <input
                            type="text"
                            value={qual.issuer}
                            onChange={(e) => updateQualification(qual.id, 'issuer', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Project Management Institute (PMI)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Year Obtained</label>
                          <input
                            type="text"
                            value={qual.year}
                            onChange={(e) => updateQualification(qual.id, 'year', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="2023"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-1">Expiry Date (Optional)</label>
                          <input
                            type="text"
                            value={qual.expiryDate || ''}
                            onChange={(e) => updateQualification(qual.id, 'expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="MM/YYYY or N/A"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-1">Credential ID (Optional)</label>
                        <input
                          type="text"
                          value={qual.credentialId || ''}
                          onChange={(e) => updateQualification(qual.id, 'credentialId', e.target.value)}
                          className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Certificate or license ID number"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary mb-1">Additional Details (Optional)</label>
                        <textarea
                          value={qual.details || ''}
                          onChange={(e) => updateQualification(qual.id, 'details', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-secondary bg-primary text-primary rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="Additional information about this qualification..."
                        />
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                        <button
                          onClick={() => setEditingQualification(null)}
                          className="px-3 py-1 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingQualification(null)}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={qual.id} className="p-4 border border-secondary rounded-lg hover:border-purple-300 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-primary flex items-center">
                          {qual.name}
                          {qual.autoExtracted && (
                            <CheckCircle className="h-4 w-4 text-green-600 ml-2" title="Auto-extracted by AI" />
                          )}
                        </h4>
                        <p className="text-purple-600 dark:text-purple-400 flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {qual.issuer}
                        </p>
                        <p className="text-sm text-secondary flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {qual.year}
                          {qual.expiryDate && ` - Expires: ${qual.expiryDate}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingQualification(qual.id)}
                          className="p-1 text-secondary hover:text-primary rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeQualification(qual.id)}
                          className="p-1 text-secondary hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {qual.details && (
                      <div className="mt-2">
                        <p className="text-sm text-secondary">{qual.details}</p>
                      </div>
                    )}
                    
                    {qual.credentialId && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Credential ID: {qual.credentialId}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? (
            <RotateCcw className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>
    </div>
  );
}