import {
    ComponentRef, ElementRef, Input, ViewContainerRef, Component, ViewChild,
    ChangeDetectionStrategy, Injector, OnInit, OnDestroy
} from '@angular/core';

import { PropertyModel } from '../types/content-type';
import { CmsPropertyRenderFactoryResolver } from './property-render.factory';
import { InsertPointDirective } from './insert-point.directive';
import { PropertyDirectiveBase } from './property-directive.base';

@Component({
    selector: '[cmsProperty]',
    exportAs: 'cmsProperty',
    template: `<ng-container cmsInsertPoint></ng-container><ng-content></ng-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CmsPropertyDirective extends PropertyDirectiveBase implements OnInit, OnDestroy {

    @ViewChild(InsertPointDirective, { static: true }) pageEditHost: InsertPointDirective;

    ngEditMode: boolean = false;

    @Input('cmsProperty')
    get model(): PropertyModel {
        return this._model;
    }
    set model(value: PropertyModel) {
        this._model = value;

    }
    private _model: PropertyModel;
    private viewContainerRef: ViewContainerRef;
    private componentRefs: ComponentRef<any>[] = [];

    constructor(
        injector: Injector,
        elementRef: ElementRef,
        private propertyRenderFactoryResolver: CmsPropertyRenderFactoryResolver) {
        super(injector, elementRef);
    }

    ngOnInit() {
        super.ngOnInit();
        this.viewContainerRef = this.pageEditHost.viewContainerRef;
        this.viewContainerRef.clear();
        this.renderProperty();
    }

    private renderProperty() {
        const propertyFactory = this.propertyRenderFactoryResolver.resolvePropertyRenderFactory(this.model.property.metadata.displayType);
        if (!propertyFactory) {
            throw new Error(`Can not resolver propertyRender Factory for ${this.model.property.metadata.displayType}`);
        }

        const propertyComponent = propertyFactory.createPropertyComponent(this.model.property, this.model.value);
        this.viewContainerRef.insert(propertyComponent.hostView);
        this.componentRefs.push(propertyComponent);
    }

    ngOnDestroy() {
        super.ngOnDestroy();
        if (this.componentRefs) {
            this.componentRefs.forEach(component => component.destroy());
            this.componentRefs = [];
        }
        this.viewContainerRef.clear();
    }
}
