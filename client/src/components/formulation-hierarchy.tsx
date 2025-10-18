import type { Formulation, Category } from "@shared/schema";

interface FormulationHierarchyProps {
  formulation: Formulation;
  category?: Category;
}

export default function FormulationHierarchy({ formulation, category }: FormulationHierarchyProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article>
        {/* H1 - Main Formulation Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {formulation.name}
        </h1>

        {/* H2 - Overview Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Overview
          </h2>
          <p className="text-gray-700 mb-3">{formulation.description}</p>
          {category && (
            <p className="text-gray-600">
              <strong>Category:</strong> {category.name}
            </p>
          )}
        </section>

        {/* H2 - Ingredients Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Ingredients
          </h2>
          
          {/* H3 - Ingredient Subgroups */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Primary Components
              </h3>
              <p className="text-gray-700">{formulation.ingredients}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Additives & Modifiers
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Optional Enhancements
              </h3>
              <p className="text-gray-700"></p>
            </div>
          </div>
        </section>

        {/* H2 - Manufacturing Process Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Manufacturing Process
          </h2>
          
          {/* H3 - Manufacturing Steps */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Step 1: Preparation
              </h3>
              <p className="text-gray-700">{formulation.instructions}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Step 2: Mixing
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Step 3: Processing
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Step 4: Quality Control
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Step 5: Packaging
              </h3>
              <p className="text-gray-700"></p>
            </div>
          </div>
        </section>

        {/* H2 - Applications Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Applications & Uses
          </h2>
          <p className="text-gray-700">{formulation.usageInstructions}</p>
        </section>

        {/* H2 - Properties Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Chemical Product Properties & Characteristics
          </h2>
          
          {/* H3 - Property Subcategories */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Physical Properties
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>pH Level:</strong> {formulation.phLevel}
                </p>
                {formulation.viscosity && (
                  <p className="text-gray-700">
                    <strong>Viscosity:</strong> {formulation.viscosity}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Performance Characteristics
              </h3>
              <p className="text-gray-700">
                <strong>Product Type:</strong> {category?.name || 'Professional Chemical'}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Compliance & Certification
              </h3>
              {formulation.certification && (
                <p className="text-gray-700">
                  <strong>Complies with:</strong> {formulation.certification}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* H2 - Manufacturing Production Details */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Manufacturing Production Details
          </h2>
          
          {/* H3 - Production Subcategories */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Batch Information
              </h3>
              <p className="text-gray-700">
                <strong>Batch Size:</strong> {formulation.batchSize}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Processing Parameters
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Processing Time:</strong> {formulation.processingTime}
                </p>
                <p className="text-gray-700">
                  <strong>Processing Temperature:</strong> {formulation.temperature || 'Standard ambient conditions'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Equipment Requirements
              </h3>
              <p className="text-gray-700">{formulation.equipment}</p>
            </div>
          </div>
        </section>

        {/* H2 - Storage & Packaging Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Storage & Packaging Requirements
          </h2>
          
          {/* H3 - Storage Subcategories */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Shelf Life
              </h3>
              <p className="text-gray-700">{formulation.shelfLife}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Storage Conditions
              </h3>
              <p className="text-gray-700">{formulation.storageConditions}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Packaging Specifications
              </h3>
              <p className="text-gray-700"></p>
            </div>
          </div>
        </section>

        {/* H2 - Safety & Handling Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Safety & Handling Guidelines
          </h2>
          
          {/* H3 - Safety Subcategories */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Personal Protective Equipment (PPE)
              </h3>
              <p className="text-gray-700">
                Use appropriate personal protective equipment including safety glasses, gloves, and lab coat when handling chemical formulations.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Handling Precautions
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                First Aid Measures
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Emergency Response
              </h3>
              <p className="text-gray-700"></p>
            </div>
          </div>
        </section>

        {/* H2 - FAQs Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Frequently Asked Questions
          </h2>
          
          {/* H3 - Individual FAQs */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                What is the recommended application method?
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Can this formulation be customized?
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                What is the typical yield per batch?
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Are there any regulatory requirements?
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                What is the recommended quality control testing?
              </h3>
              <p className="text-gray-700"></p>
            </div>
          </div>
        </section>

        {/* H2 - Technical Specifications */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-primary pb-2">
            Technical Specifications
          </h2>
          
          {/* H3 - Specification Subcategories */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Standard Specifications
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Testing Methods
              </h3>
              <p className="text-gray-700"></p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Quality Assurance Parameters
              </h3>
              <p className="text-gray-700"></p>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
