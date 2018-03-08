import { Component, Input, AfterViewInit, ViewChild, ComponentFactoryResolver, OnDestroy, Inject, Injector, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { PAGE_TYPE_METADATA_KEY, PROPERTY_METADATA_KEY, PROPERTIES_METADATA_KEY } from '@angular-cms/core';
import { CMS, UIHint, CmsProperty, InsertPointDirective, Content, ISelectionFactory } from '@angular-cms/core';
import { ContentService, PageService, BlockService } from '@angular-cms/core';

import { Elements, PropertyListComponent, SelectProperty } from '@angular-cms/properties';

import { PAGE_TYPE, BLOCK_TYPE } from './../../constants';

@Component({
    templateUrl: './content-form-edit.component.html'
})
export class ContentFormEditComponent implements OnInit {
    subParams: Subscription;

    type: string;
    contentForm: any; //FormGroup
    formModel: any = {};

    private currentContent: any;

    @ViewChild(InsertPointDirective) pageEditHost: InsertPointDirective;

    constructor(
        @Inject(ComponentFactoryResolver) private componentFactoryResolver: ComponentFactoryResolver,
        private injector: Injector,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private contentService: ContentService,
        private pageService: PageService,
        private blockService: BlockService
    ) { }

    ngOnInit() {
        this.contentForm = new FormGroup({});
        this.subParams = this.route.params.subscribe(params => {
            let contentId = params['id'] || '';
            this.type = params['type'];

            if (contentId) {
                switch (this.type) {
                    case PAGE_TYPE:
                        this.pageService.getPageContent(contentId).subscribe(res => {
                            this.bindDataForContentForm(res, CMS.PAGE_TYPES[res.contentType])
                        });
                        break;
                    case BLOCK_TYPE:
                        this.blockService.getBlockContent({ _id: contentId }).subscribe(res => {
                            this.bindDataForContentForm(res, CMS.BLOCK_TYPES[res.contentType])
                        });
                        break;
                }
            }
        });
    }

    private bindDataForContentForm(currentContent, contentType) {
        this.currentContent = currentContent;
        if (this.currentContent.properties) {
            this.formModel = this.currentContent.properties;
        } else {
            this.formModel = {};
        }

        if (contentType) {
            let properties = Reflect.getMetadata(PROPERTIES_METADATA_KEY, contentType);
            let propertiesMetadata = [];
            if (properties)
                properties.forEach(element => {
                    propertiesMetadata.push({
                        name: element,
                        metadata: Reflect.getMetadata(PROPERTY_METADATA_KEY, contentType, element)
                    })
                });

            if (propertiesMetadata.length > 0) {
                this.createFormGroup(propertiesMetadata);
                this.createFormControls(propertiesMetadata);
            }
        }
    }

    private createFormGroup(properties) {
        if (properties) {
            let group = {};
            properties.forEach(property => {
                let validators = [];
                if (property.metadata.validates) {
                    property.metadata.validates.forEach(validate => {
                        validators.push(validate.validateFn);
                    })
                }

                group[property.name] = [this.formModel[property.name], validators]
            });
            this.contentForm = this.formBuilder.group(group)
        }
    }

    private createFormControls(properties) {
        if (properties) {
            let viewContainerRef = this.pageEditHost.viewContainerRef;
            viewContainerRef.clear();

            properties.forEach(property => {
                if (CMS.PROPERTIES[property.metadata.displayType]) {
                    let propertyFactory = this.componentFactoryResolver.resolveComponentFactory(CMS.PROPERTIES[property.metadata.displayType]);
                    let propertyComponent = viewContainerRef.createComponent(propertyFactory);
                    (<CmsProperty>propertyComponent.instance).label = property.metadata.displayName;
                    (<CmsProperty>propertyComponent.instance).formGroup = this.contentForm;
                    (<CmsProperty>propertyComponent.instance).propertyName = property.name;

                    if (propertyComponent.instance instanceof SelectProperty) {
                        (<SelectProperty>propertyComponent.instance).selectItems = (<ISelectionFactory>(this.injector.get(property.metadata.selectionFactory))).GetSelections();
                    } else if (propertyComponent.instance instanceof PropertyListComponent) {
                        (<PropertyListComponent>propertyComponent.instance).itemType = property.metadata.propertyListItemType;
                    }
                }
            });
        }
    }

    onSubmit(isPublished: boolean, formId: any) {
        console.log(this.contentForm.value);
        console.log(formId);
        if (this.contentForm.valid) {
            if (this.currentContent) {
                this.currentContent.properties = this.contentForm.value;
                this.currentContent.isDirty = formId.dirty;
                this.currentContent.isPublished = isPublished;

                switch (this.type) {
                    case PAGE_TYPE:
                        if (this.currentContent.isDirty || this.currentContent.isPublished) {
                            this.pageService.editPage(this.currentContent).subscribe(res => {
                                console.log(res);
                                formId.control.markAsPristine();
                            })
                        }
                        break;
                    case BLOCK_TYPE:
                        if (this.currentContent.isDirty) {
                            this.blockService.editBlockContent(this.currentContent).subscribe(res => {
                                console.log(res);
                                formId.control.markAsPristine();
                            })
                        }
                        break;
                }

            }
        }
    }

    ngOnDestroy() {
        this.subParams.unsubscribe();
        //TODO: Need to destroy all dynamic components which is created before
    }
}