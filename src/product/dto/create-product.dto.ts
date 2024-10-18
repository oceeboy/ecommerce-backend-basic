import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  /* This is added through cloudinary and should be optional */
  @IsOptional() // Make it optional in case no image is uploaded
  @IsString()
  image?: string; // Use "?" to mark it as optional

  @IsNotEmpty()
  @IsString()
  category: string;
}
