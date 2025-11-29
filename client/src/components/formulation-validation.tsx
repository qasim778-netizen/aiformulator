import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Beaker,
  Shield,
  AlertCircle,
  Lightbulb,
  FileText
} from "lucide-react";

interface ValidationIssue {
  type: 'critical' | 'major' | 'minor';
  category: string;
  message: string;
  ingredient?: string;
  actualValue?: number;
  expectedRange?: string;
}

interface ValidationWarning {
  category: string;
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  overallScore: number;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  suggestions: string[];
  summary: string;
}

interface IngredientBreakdown {
  [key: string]: {
    count: number;
    total: number;
    ingredients: string[];
  };
}

interface FormulationValidationProps {
  formulationId?: string;
  ingredients?: string;
  productType?: string;
  phLevel?: string;
  showFullReport?: boolean;
}

export function FormulationValidation({ 
  formulationId, 
  ingredients, 
  productType, 
  phLevel,
  showFullReport = false 
}: FormulationValidationProps) {
  const [isExpanded, setIsExpanded] = useState(showFullReport);
  
  const { data, isLoading, error } = useQuery({
    queryKey: formulationId 
      ? ['/api/formulations', formulationId, 'validate'] 
      : ['/api/formulations/validate', ingredients],
    queryFn: async () => {
      if (formulationId) {
        const res = await fetch(`/api/formulations/${formulationId}/validate`);
        if (!res.ok) throw new Error('Failed to validate formulation');
        return res.json();
      } else if (ingredients) {
        const res = await fetch('/api/formulations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients, productType, phLevel })
        });
        if (!res.ok) throw new Error('Failed to validate formulation');
        return res.json();
      }
      return null;
    },
    enabled: !!(formulationId || ingredients)
  });
  
  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-blue-700">Validating formulation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data) {
    return null;
  }
  
  const validation: ValidationResult = data.validation;
  const breakdown: IngredientBreakdown = data.breakdown;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-yellow-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'major': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  const getIssueBadgeColor = (type: string) => {
    switch (type) {
      case 'critical': return "bg-red-100 text-red-700 border-red-200";
      case 'major': return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <Card className={validation.isValid ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <CardTitle className="text-lg" data-testid="validation-title">
              Industrial Standards Validation
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={`${getScoreColor(validation.overallScore)} font-bold`}
            data-testid="validation-score"
          >
            Score: {validation.overallScore}/100
          </Badge>
        </div>
        <CardDescription className="mt-1" data-testid="validation-summary">
          {validation.summary}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Quality Score</span>
            <span className={getScoreColor(validation.overallScore)}>{validation.overallScore}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor(validation.overallScore)} transition-all duration-500`}
              style={{ width: `${validation.overallScore}%` }}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {validation.isValid && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200" data-testid="badge-valid">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Production Ready
            </Badge>
          )}
          {validation.issues.filter(i => i.type === 'critical').length > 0 && (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200" data-testid="badge-critical">
              <XCircle className="h-3 w-3 mr-1" />
              {validation.issues.filter(i => i.type === 'critical').length} Critical Issues
            </Badge>
          )}
          {validation.issues.filter(i => i.type === 'major').length > 0 && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200" data-testid="badge-major">
              <AlertCircle className="h-3 w-3 mr-1" />
              {validation.issues.filter(i => i.type === 'major').length} Major Issues
            </Badge>
          )}
          {validation.warnings.length > 0 && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200" data-testid="badge-warnings">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {validation.warnings.length} Warnings
            </Badge>
          )}
        </div>
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid="button-toggle-details">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Full Report
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {Object.keys(breakdown).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Beaker className="h-4 w-4" />
                  Ingredient Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(breakdown).map(([category, data]) => (
                    <div key={category} className="p-2 bg-white rounded border text-xs" data-testid={`breakdown-${category.toLowerCase().replace(/\s+/g, '-')}`}>
                      <div className="flex justify-between font-medium">
                        <span>{category}</span>
                        <span>{data.total.toFixed(1)}%</span>
                      </div>
                      <div className="text-gray-500 mt-1">
                        {data.count} ingredient{data.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {validation.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Issues Found ({validation.issues.length})
                </h4>
                <div className="space-y-2">
                  {validation.issues.map((issue, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded border ${getIssueBadgeColor(issue.type)} bg-opacity-50`}
                      data-testid={`issue-${idx}`}
                    >
                      <div className="flex items-start gap-2">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {issue.category}
                            <Badge variant="outline" className={`text-xs ${getIssueBadgeColor(issue.type)}`}>
                              {issue.type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{issue.message}</p>
                          {issue.expectedRange && (
                            <p className="text-xs mt-1 opacity-75">
                              Expected: {issue.expectedRange}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {validation.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Warnings ({validation.warnings.length})
                </h4>
                <div className="space-y-2">
                  {validation.warnings.map((warning, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded border border-yellow-200 bg-yellow-50"
                      data-testid={`warning-${idx}`}
                    >
                      <div className="font-medium text-sm text-yellow-800">{warning.category}</div>
                      <p className="text-sm text-yellow-700 mt-1">{warning.message}</p>
                      {warning.suggestion && (
                        <p className="text-xs text-yellow-600 mt-1 italic">
                          Suggestion: {warning.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {validation.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Suggestions
                </h4>
                <ul className="space-y-1">
                  {validation.suggestions.map((suggestion, idx) => (
                    <li 
                      key={idx} 
                      className="text-sm text-blue-700 flex items-start gap-2"
                      data-testid={`suggestion-${idx}`}
                    >
                      <span className="text-blue-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export function ValidationBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 75) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (score >= 60) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };
  
  const getIcon = () => {
    if (score >= 90) return <CheckCircle2 className="h-3 w-3" />;
    if (score >= 60) return <AlertTriangle className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };

  return (
    <Badge variant="outline" className={`${getColor()} gap-1`} data-testid="validation-badge">
      {getIcon()}
      <span>Quality: {score}%</span>
    </Badge>
  );
}
